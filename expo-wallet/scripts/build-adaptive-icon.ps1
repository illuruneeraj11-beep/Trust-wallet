param(
  [string]$Source = (Join-Path $PSScriptRoot "..\assets\brands\trust-wallet-icon.png"),
  [string]$Destination = (Join-Path $PSScriptRoot "..\assets\brands\trust-wallet-adaptive-foreground.png"),
  [int]$CanvasSize = 1024,
  [int]$ForegroundWidth = 390
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$sourcePath = [System.IO.Path]::GetFullPath($Source)
$destinationPath = [System.IO.Path]::GetFullPath($Destination)
$sourceImage = [System.Drawing.Bitmap]::FromFile($sourcePath)

try {
  $minX = $sourceImage.Width
  $minY = $sourceImage.Height
  $maxX = -1
  $maxY = -1

  for ($y = 0; $y -lt $sourceImage.Height; $y++) {
    for ($x = 0; $x -lt $sourceImage.Width; $x++) {
      $color = $sourceImage.GetPixel($x, $y)
      $maximum = [Math]::Max([int]$color.R, [Math]::Max([int]$color.G, [int]$color.B))
      $minimum = [Math]::Min([int]$color.R, [Math]::Min([int]$color.G, [int]$color.B))
      if (($maximum - $minimum) -gt 20 -and $color.B -gt 80) {
        if ($x -lt $minX) { $minX = $x }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }

  if ($maxX -lt $minX -or $maxY -lt $minY) {
    throw "The shield artwork could not be located in $sourcePath."
  }

  $cropWidth = $maxX - $minX + 1
  $cropHeight = $maxY - $minY + 1
  $foregroundHeight = [int][Math]::Round($ForegroundWidth * $cropHeight / $cropWidth)
  $targetX = [int][Math]::Round(($CanvasSize - $ForegroundWidth) / 2)
  $targetY = [int][Math]::Round(($CanvasSize - $foregroundHeight) / 2)

  $isolated = New-Object System.Drawing.Bitmap($cropWidth, $cropHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  try {
    for ($y = 0; $y -lt $cropHeight; $y++) {
      for ($x = 0; $x -lt $cropWidth; $x++) {
        $color = $sourceImage.GetPixel($minX + $x, $minY + $y)
        $maximum = [Math]::Max([int]$color.R, [Math]::Max([int]$color.G, [int]$color.B))
        $minimum = [Math]::Min([int]$color.R, [Math]::Min([int]$color.G, [int]$color.B))
        if (($maximum - $minimum) -le 12 -and $minimum -gt 210) {
          $isolated.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
        } else {
          $isolated.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $color.R, $color.G, $color.B))
        }
      }
    }

    $canvas = New-Object System.Drawing.Bitmap($CanvasSize, $CanvasSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
      $canvas.SetResolution(72, 72)
      $graphics = [System.Drawing.Graphics]::FromImage($canvas)
      try {
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $destinationRectangle = New-Object System.Drawing.Rectangle($targetX, $targetY, $ForegroundWidth, $foregroundHeight)
        $sourceRectangle = New-Object System.Drawing.Rectangle(0, 0, $cropWidth, $cropHeight)
        $graphics.DrawImage($isolated, $destinationRectangle, $sourceRectangle, [System.Drawing.GraphicsUnit]::Pixel)
      } finally {
        $graphics.Dispose()
      }

      $destinationDirectory = [System.IO.Path]::GetDirectoryName($destinationPath)
      [System.IO.Directory]::CreateDirectory($destinationDirectory) | Out-Null
      $canvas.Save($destinationPath, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally {
      $canvas.Dispose()
    }
  } finally {
    $isolated.Dispose()
  }
} finally {
  $sourceImage.Dispose()
}

Write-Output "Created $destinationPath with a ${ForegroundWidth}px foreground on a ${CanvasSize}px transparent canvas."
