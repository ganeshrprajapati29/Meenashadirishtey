import 'package:material_ui/material_ui.dart';
import 'package:google_fonts/google_fonts.dart';

class MsrColors {
  static const maroon = Color(0xFF7A1F1F);
  static const maroonDark = Color(0xFF451111);
  static const maroonLight = Color(0xFFFDF3F3);
  static const brown = Color(0xFF9A3412);
  static const gold = Color(0xFFD4A017);
  static const goldLight = Color(0xFFF5C542);
  static const goldPale = Color(0xFFFEFAEC);
  static const saffron = Color(0xFFE8762C);
  static const cream = Color(0xFFFFF8EC);
  static const ink = Color(0xFF2B1A14);
  static const green = Color(0xFF059669);

  static const royal = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [maroonDark, maroon, brown],
  );
  static const goldShine = LinearGradient(colors: [goldLight, gold, Color(0xFFAE7D10)]);
}

ThemeData buildTheme() {
  final base = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(seedColor: MsrColors.maroon, primary: MsrColors.maroon, secondary: MsrColors.gold, surface: Colors.white),
    scaffoldBackgroundColor: MsrColors.cream,
  );
  final text = GoogleFonts.poppinsTextTheme(base.textTheme).apply(bodyColor: MsrColors.ink, displayColor: MsrColors.ink);
  return base.copyWith(
    textTheme: text,
    appBarTheme: AppBarTheme(
      backgroundColor: MsrColors.maroon,
      foregroundColor: Colors.white,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: GoogleFonts.playfairDisplay(fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: MsrColors.maroon,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
        textStyle: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 15),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: MsrColors.maroon,
        side: const BorderSide(color: MsrColors.maroon),
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 13),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: Colors.brown.shade100)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide(color: Colors.brown.shade100)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: MsrColors.maroon, width: 1.6)),
    ),
    cardTheme: CardThemeData(
      color: Colors.white,
      elevation: 2,
      shadowColor: MsrColors.maroon.withValues(alpha: 0.15),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      margin: EdgeInsets.zero,
    ),
    chipTheme: base.chipTheme.copyWith(backgroundColor: MsrColors.maroonLight, labelStyle: const TextStyle(color: MsrColors.maroon, fontSize: 12)),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: Colors.white,
      indicatorColor: MsrColors.goldPale,
      labelTextStyle: WidgetStateProperty.all(GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w600)),
    ),
  );
}

TextStyle displayStyle(double size, {Color color = MsrColors.maroon}) =>
    GoogleFonts.playfairDisplay(fontSize: size, fontWeight: FontWeight.w700, color: color);
