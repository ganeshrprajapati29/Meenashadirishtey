import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/config.dart';
import '../core/theme.dart';
import '../services/api.dart';
import '../services/app_state.dart';
import '../widgets/common.dart';
import 'notifications_screen.dart';
import 'photos_screen.dart';
import 'plans_screen.dart';
import 'profile_detail_screen.dart';
import 'profile_form_screen.dart';
import 'profile_list_screen.dart';

class AccountTab extends StatelessWidget {
  const AccountTab({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final p = app.profile ?? {};
    final photos = (p['photos'] as List?) ?? [];
    final photo = photos.isEmpty ? null : (photos.firstWhere((x) => x['isPrimary'] == true, orElse: () => photos.first))['url'];
    void go(Widget w) => Navigator.push(context, MaterialPageRoute(builder: (_) => w));

    Widget tile(IconData icon, String label, VoidCallback onTap, {Widget? trailing, Color? color}) => ListTile(
          leading: Icon(icon, color: color ?? MsrColors.gold),
          title: Text(label, style: TextStyle(color: color)),
          trailing: trailing ?? const Icon(Icons.chevron_right),
          onTap: onTap,
        );

    return Scaffold(
      body: ListView(padding: EdgeInsets.zero, children: [
        Container(
          decoration: const BoxDecoration(gradient: MsrColors.royal),
          padding: EdgeInsets.fromLTRB(20, MediaQuery.of(context).padding.top + 24, 20, 24),
          child: Column(children: [
            CircleAvatar(radius: 48, backgroundColor: MsrColors.goldLight, child: ClipOval(child: SizedBox(width: 92, height: 92, child: ProfileImage(url: photo, gender: p['gender'])))),
            const SizedBox(height: 10),
            Text('${p['firstName'] ?? ''} ${p['lastName'] ?? ''}', style: displayStyle(22, color: Colors.white)),
            Text('${p['profileId'] ?? ''} · +91 ${app.user?['phone'] ?? ''}', style: const TextStyle(color: Colors.white70)),
            const SizedBox(height: 8),
            app.isPremium
                ? InfoChip('${app.user?['premium']?['planName']} · ${app.user?['premium']?['contactsLeft']} ${context.tt('contacts', 'नंबर')}', icon: Icons.workspace_premium, bg: MsrColors.goldLight, fg: MsrColors.maroonDark)
                : GoldButton(label: context.tt('Upgrade to Premium', 'प्रीमियम लें'), icon: Icons.workspace_premium, onPressed: () => go(const PlansScreen())),
          ]),
        ),
        const SizedBox(height: 8),
        Card(
          margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          child: Column(children: [
            tile(Icons.visibility, context.tt('View my profile', 'मेरी प्रोफाइल देखें'), () => go(ProfileDetailScreen(id: p['profileId'] ?? ''))),
            tile(Icons.edit, context.tt('Edit profile', 'प्रोफाइल बदलें'), () async {
              final r = await Api.I.get('/profiles/me');
              if (context.mounted) go(ProfileFormScreen(existing: Map<String, dynamic>.from(r['profile'])));
            }),
            tile(Icons.photo_library, context.tt('My photos', 'मेरी फोटो'), () async {
              await Navigator.push(context, MaterialPageRoute(builder: (_) => const PhotosScreen()));
              app.refresh();
            }),
          ]),
        ),
        Card(
          margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          child: Column(children: [
            tile(Icons.favorite, context.tt('Shortlisted', 'शॉर्टलिस्ट'), () => go(const ProfileListScreen(kind: 'shortlist'))),
            tile(Icons.remove_red_eye, context.tt('Who viewed me', 'किसने प्रोफाइल देखी'), () => go(const ProfileListScreen(kind: 'visitors'))),
            tile(Icons.notifications, context.tt('Notifications', 'सूचनाएं'), () => go(const NotificationsScreen()),
                trailing: app.unreadNotifications > 0 ? Badge(label: Text('${app.unreadNotifications}')) : null),
            tile(Icons.workspace_premium, context.tt('Membership plans', 'मेंबरशिप प्लान'), () => go(const PlansScreen())),
          ]),
        ),
        Card(
          margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          child: Column(children: [
            tile(Icons.translate, context.tt('Language', 'भाषा'), () => app.setLang(app.lang == 'hi' ? 'en' : 'hi'), trailing: Text(app.lang == 'hi' ? 'हिंदी' : 'English', style: const TextStyle(fontWeight: FontWeight.w600))),
            tile(Icons.shield, context.tt('Safety tips', 'सुरक्षा सुझाव'), () => launchUrl(Uri.parse('${AppConfig.apiUrl}/safety'))),
            tile(Icons.support_agent, context.tt('Contact support', 'सहायता'), () => launchUrl(Uri.parse('${AppConfig.apiUrl}/contact'))),
            tile(Icons.privacy_tip, context.tt('Privacy policy', 'गोपनीयता नीति'), () => launchUrl(Uri.parse('${AppConfig.apiUrl}/privacy'))),
          ]),
        ),
        Card(
          margin: const EdgeInsets.fromLTRB(14, 6, 14, 24),
          child: Column(children: [
            tile(Icons.logout, context.tt('Logout', 'लॉगआउट'), () => app.logout(), color: Colors.red.shade700, trailing: const SizedBox()),
            tile(Icons.delete_forever, context.tt('Delete account', 'अकाउंट हटाएं'), () async {
              final ok = await showDialog<bool>(context: context, builder: (c) => AlertDialog(
                    title: Text(context.tt('Delete account permanently?', 'अकाउंट हमेशा के लिए हटाएं?')),
                    actions: [TextButton(onPressed: () => Navigator.pop(c, false), child: Text(context.tt('Cancel', 'रद्द'))), TextButton(onPressed: () => Navigator.pop(c, true), child: Text(context.tt('Delete', 'हटाएं'), style: const TextStyle(color: Colors.red)))],
                  ));
              if (ok == true) {
                await Api.I.delete('/auth/me');
                await app.logout();
              }
            }, color: Colors.red.shade700, trailing: const SizedBox()),
          ]),
        ),
        Center(child: Text('Meena Shadi Rishtey v1.0.0', style: TextStyle(color: Colors.grey.shade500, fontSize: 12))),
        const SizedBox(height: 20),
      ]),
    );
  }
}
