import 'package:flutter/material.dart';

class WalletLogo extends StatelessWidget {
  final double size;

  const WalletLogo({super.key, this.size = 80});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(size * 0.25),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF2D9FFF),
            Color(0xFF00D4A5),
          ],
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF2D9FFF).withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Center(
        child: Icon(
          Icons.shield_rounded,
          size: size * 0.55,
          color: Colors.white,
        ),
      ),
    );
  }
}
