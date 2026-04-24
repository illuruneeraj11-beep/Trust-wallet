import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _darkMode = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F0F0F),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Settings',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w600,
            fontSize: 17,
          ),
        ),
        centerTitle: true,
      ),
      body: ListView(
        children: [
          // ── Trust Premium ─────────────────────────────────────────────
          const _SectionLabel('Trust Premium'),
          _buildPremiumCard(context),
          const SizedBox(height: 4),
          // ── Dark Mode toggle ──────────────────────────────────────────
          _buildDarkModeRow(context),
          const _Divider(),
          // ── Utility items ─────────────────────────────────────────────
          _buildRow(Icons.menu_book, 'Address Book'),
          _buildRow(Icons.grid_view_outlined, 'Sync to Extension'),
          _buildRow(Icons.alternate_email, 'Trust handles'),
          _buildRow(Icons.crop_free_rounded, 'Scan QR code'),
          _buildRow(Icons.cable, 'WalletConnect'),
          const _Divider(),
          // ── Settings ──────────────────────────────────────────────────
          _buildRow(Icons.settings_outlined, 'Preferences'),
          _buildRowWithDot(Icons.lock_outlined, 'Security'),
          _buildRow(Icons.notifications_outlined, 'Notifications'),
          const _Divider(),
          // ── Help ──────────────────────────────────────────────────────
          _buildRow(Icons.headset_mic, 'Support'),
          _buildRow(Icons.verified_user_outlined, 'About'),
          const _Divider(),
          // ── Social links ──────────────────────────────────────────────
          _buildSocialRow(Icons.close, 'X'),
          _buildSocialRow(Icons.send_outlined, 'Telegram'),
          _buildSocialRow(Icons.facebook, 'Facebook'),
          _buildSocialRow(Icons.forum_outlined, 'Reddit'),
          _buildSocialRow(Icons.play_circle_outline_rounded, 'Youtube'),
          _buildSocialRow(Icons.camera_alt_outlined, 'Instagram'),
          _buildSocialRow(Icons.music_note, 'TikTok'),
          const SizedBox(height: 60),
        ],
      ),
    );
  }

  // Trust Premium card
  Widget _buildPremiumCard(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1C1C1E),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF2A2A2A), width: 0.5),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: const Color(0xFF2A2A2A),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.workspace_premium,
                color: Colors.amber, size: 26),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text('Level up',
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                    )),
                SizedBox(height: 3),
                Text('Unlock exclusive rewards',
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 13,
                    )),
              ],
            ),
          ),
          const SizedBox(width: 12),
          TextButton(
            onPressed: () {},
            style: TextButton.styleFrom(
              backgroundColor: AppColors.accentGreen,
              foregroundColor: Colors.black,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(50),
              ),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: const Text('Begin',
                style: TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                    color: Colors.black)),
          ),
        ],
      ),
    );
  }

  // Dark Mode toggle row
  Widget _buildDarkModeRow(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Row(
        children: [
          _IconBox(Icons.dark_mode),
          const SizedBox(width: 16),
          const Expanded(
            child: Text('Dark Mode',
                style: TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 15,
                    fontWeight: FontWeight.w400)),
          ),
          Switch(
            value: _darkMode,
            onChanged: (v) => setState(() => _darkMode = v),
            activeColor: Colors.white,
            activeTrackColor: AppColors.accentGreen,
            inactiveThumbColor: Colors.white,
            inactiveTrackColor: const Color(0xFF3A3A3A),
          ),
        ],
      ),
    );
  }

  // Plain row
  Widget _buildRow(IconData icon, String label) {
    return InkWell(
      onTap: () {},
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            _IconBox(icon),
            const SizedBox(width: 16),
            Text(label,
                style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 15,
                    fontWeight: FontWeight.w400)),
          ],
        ),
      ),
    );
  }

  // Row with red notification dot (Security)
  Widget _buildRowWithDot(IconData icon, String label) {
    return InkWell(
      onTap: () {},
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            _IconBox(icon),
            const SizedBox(width: 16),
            Text(label,
                style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 15,
                    fontWeight: FontWeight.w400)),
            const SizedBox(width: 6),
            Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                color: AppColors.accentRed,
                shape: BoxShape.circle,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Social row (same as plain, different icon style)
  Widget _buildSocialRow(IconData icon, String label) {
    return InkWell(
      onTap: () {},
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            _SocialIconBox(icon),
            const SizedBox(width: 16),
            Text(label,
                style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 15,
                    fontWeight: FontWeight.w400)),
          ],
        ),
      ),
    );
  }
}

// ─── Helper widgets ───────────────────────────────────────────────────────────
class _IconBox extends StatelessWidget {
  final IconData icon;
  const _IconBox(this.icon);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 34,
      height: 34,
      decoration: BoxDecoration(
        color: const Color(0xFF1C1C1E),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Icon(icon, size: 18, color: AppColors.textSecondary),
    );
  }
}

class _SocialIconBox extends StatelessWidget {
  final IconData icon;
  const _SocialIconBox(this.icon);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 34,
      height: 34,
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFF2A2A2A), width: 1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Icon(icon, size: 18, color: AppColors.textPrimary),
    );
  }
}

class _Divider extends StatelessWidget {
  const _Divider();

  @override
  Widget build(BuildContext context) {
    return const Divider(
      color: Color(0xFF1E1E1E),
      thickness: 0.5,
      height: 1,
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
      child: Text(
        text,
        style: const TextStyle(
          color: AppColors.textPrimary,
          fontSize: 15,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
