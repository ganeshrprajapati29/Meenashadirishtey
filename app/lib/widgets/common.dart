import 'dart:ui' show ImageFilter;
import 'package:cached_network_image/cached_network_image.dart';
import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';
import '../core/config.dart';
import '../core/theme.dart';
import '../services/app_state.dart';

extension Tt on BuildContext {
  AppState get app => read<AppState>();
  String tt(String en, String hi) => read<AppState>().lang == 'hi' ? hi : en;
  void toast(String msg, {bool error = false}) {
    ScaffoldMessenger.of(this)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(
        content: Text(msg),
        behavior: SnackBarBehavior.floating,
        backgroundColor: error ? Colors.red.shade700 : MsrColors.maroon,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ));
  }
}

class MsrLogo extends StatelessWidget {
  final double size;
  const MsrLogo({super.key, this.size = 56});
  @override
  Widget build(BuildContext context) => ClipOval(child: Image.asset('assets/brand/logo.png', width: size, height: size, fit: BoxFit.cover));
}

/// Network photo with gender placeholder
class ProfileImage extends StatelessWidget {
  final String? url;
  final String? gender;
  final BoxFit fit;
  final double blur;
  const ProfileImage({super.key, this.url, this.gender, this.fit = BoxFit.cover, this.blur = 0});
  @override
  Widget build(BuildContext context) {
    final placeholder = Image.asset(gender == 'female' ? 'assets/brand/avatar-female.png' : 'assets/brand/avatar-male.png', fit: fit);
    if (url == null || url!.isEmpty) return placeholder;
    Widget img = CachedNetworkImage(
      imageUrl: AppConfig.fileUrl(url),
      fit: fit,
      placeholder: (_, _) => Container(color: MsrColors.maroonLight),
      errorWidget: (_, _, _) => placeholder,
    );
    if (blur > 0) {
      img = ImageFiltered(imageFilter: ImageFilter.blur(sigmaX: blur, sigmaY: blur), child: img);
    }
    return img;
  }
}

class Loading extends StatelessWidget {
  const Loading({super.key});
  @override
  Widget build(BuildContext context) => const Center(child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator(color: MsrColors.maroon)));
}

class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? text;
  final Widget? action;
  const EmptyState({super.key, required this.icon, required this.title, this.text, this.action});
  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            CircleAvatar(radius: 36, backgroundColor: MsrColors.maroonLight, child: Icon(icon, size: 34, color: MsrColors.maroon)),
            const SizedBox(height: 14),
            Text(title, textAlign: TextAlign.center, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600, color: MsrColors.maroon)),
            if (text != null) ...[const SizedBox(height: 6), Text(text!, textAlign: TextAlign.center, style: TextStyle(color: Colors.grey.shade600))],
            if (action != null) ...[const SizedBox(height: 16), action!],
          ]),
        ),
      );
}

class GoldButton extends StatelessWidget {
  final String label;
  final IconData? icon;
  final VoidCallback? onPressed;
  const GoldButton({super.key, required this.label, this.icon, this.onPressed});
  @override
  Widget build(BuildContext context) => DecoratedBox(
        decoration: BoxDecoration(gradient: MsrColors.goldShine, borderRadius: BorderRadius.circular(30), boxShadow: [BoxShadow(color: MsrColors.gold.withValues(alpha: .4), blurRadius: 14, offset: const Offset(0, 6))]),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            borderRadius: BorderRadius.circular(30),
            onTap: onPressed,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 13),
              child: Row(mainAxisSize: MainAxisSize.min, mainAxisAlignment: MainAxisAlignment.center, children: [
                if (icon != null) ...[Icon(icon, size: 18, color: MsrColors.maroonDark), const SizedBox(width: 8)],
                Text(label, style: const TextStyle(fontWeight: FontWeight.w700, color: MsrColors.maroonDark)),
              ]),
            ),
          ),
        ),
      );
}

class SectionTitle extends StatelessWidget {
  final String title;
  final Widget? trailing;
  const SectionTitle(this.title, {super.key, this.trailing});
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 10),
        child: Row(children: [
          Container(width: 4, height: 20, decoration: BoxDecoration(gradient: MsrColors.goldShine, borderRadius: BorderRadius.circular(4))),
          const SizedBox(width: 8),
          Expanded(child: Text(title, style: displayStyle(19))),
          ?trailing,
        ]),
      );
}

class InfoChip extends StatelessWidget {
  final String text;
  final IconData? icon;
  final Color bg;
  final Color fg;
  const InfoChip(this.text, {super.key, this.icon, this.bg = MsrColors.maroonLight, this.fg = MsrColors.maroon});
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          if (icon != null) ...[Icon(icon, size: 13, color: fg), const SizedBox(width: 4)],
          Text(text, style: TextStyle(fontSize: 12, color: fg, fontWeight: FontWeight.w500)),
        ]),
      );
}
