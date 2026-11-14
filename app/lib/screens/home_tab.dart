import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../services/api.dart';
import '../services/app_state.dart';
import '../widgets/banner_carousel.dart';
import '../widgets/common.dart';
import '../widgets/profile_card.dart';
import 'main_shell.dart';
import 'notifications_screen.dart';
import 'plans_screen.dart';
import 'profile_list_screen.dart';

class HomeTab extends StatefulWidget {
  const HomeTab({super.key});
  @override
  State<HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<HomeTab> {
  Map? dash;
  List? recs;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final d = await Api.I.get('/profiles/dashboard');
      final r = await Api.I.get('/profiles/recommendations', {'limit': 10});
      if (mounted) setState(() { dash = d; recs = r['items']; });
    } catch (_) {
      if (mounted) setState(() => recs = []);
    }
  }

  void _internalLink(String link) {
    if (link.startsWith('/plans')) {
      Navigator.push(context, MaterialPageRoute(builder: (_) => const PlansScreen()));
    } else if (link.startsWith('/matches')) {
      MainShell.goTab(context, 1);
    }
  }

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    final p = dash?['profile'];
    final s = dash?['stats'] ?? {};
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _load,
        color: MsrColors.maroon,
        child: CustomScrollView(slivers: [
          SliverAppBar(
            pinned: true,
            expandedHeight: 170,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(gradient: MsrColors.royal),
                padding: const EdgeInsets.fromLTRB(18, 70, 18, 16),
                child: Row(children: [
                  CircleAvatar(radius: 34, backgroundColor: MsrColors.goldLight, child: ClipOval(child: SizedBox(width: 64, height: 64, child: ProfileImage(url: p?['primaryPhoto'], gender: p?['gender'])))),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
                      Text('${context.tt('Namaste', 'नमस्ते')}, ${p?['firstName'] ?? ''} 🙏', style: displayStyle(20, color: Colors.white)),
                      Text('${p?['profileId'] ?? ''} · ${app.isPremium ? (app.user?['premium']?['planName'] ?? 'Premium') : context.tt('Free member', 'फ्री सदस्य')}', style: const TextStyle(color: MsrColors.goldLight, fontSize: 12)),
                      const SizedBox(height: 6),
                      ClipRRect(borderRadius: BorderRadius.circular(6), child: LinearProgressIndicator(value: ((p?['completeness'] ?? 0) as num) / 100, minHeight: 6, color: MsrColors.goldLight, backgroundColor: Colors.white24)),
                      const SizedBox(height: 2),
                      Text('${context.tt('Profile', 'प्रोफाइल')} ${p?['completeness'] ?? 0}% ${context.tt('complete', 'पूर्ण')}', style: const TextStyle(color: Colors.white70, fontSize: 11)),
                    ]),
                  ),
                ]),
              ),
            ),
            title: Row(children: [const MsrLogo(size: 32), const SizedBox(width: 8), Text('MSR', style: displayStyle(20, color: Colors.white))]),
            actions: [
              IconButton(
                onPressed: () async {
                  await Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen()));
                  app.refreshCounts();
                },
                icon: Badge(isLabelVisible: app.unreadNotifications > 0, label: Text('${app.unreadNotifications}'), child: const Icon(Icons.notifications_none)),
              ),
            ],
          ),
          if (dash == null)
            const SliverFillRemaining(child: Loading())
          else ...[
            if (p?['status'] == 'pending')
              SliverToBoxAdapter(child: _notice(Icons.hourglass_top, context.tt('Your profile is under review. You can send interests once approved.', 'आपकी प्रोफाइल जांच में है। स्वीकृत होने पर आप रुचि भेज सकेंगे।'), MsrColors.goldPale)),
            if (p?['status'] == 'rejected')
              SliverToBoxAdapter(child: _notice(Icons.error_outline, '${context.tt('Changes needed', 'बदलाव ज़रूरी')}: ${p?['rejectionReason'] ?? ''}', Colors.red.shade50)),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 14, 12, 0),
                child: Row(children: [
                  _stat(Icons.inbox, s['received'], context.tt('Received', 'प्राप्त'), () => MainShell.goTab(context, 2)),
                  _stat(Icons.handshake, s['accepted'], context.tt('Connected', 'जुड़े'), () => MainShell.goTab(context, 2)),
                  _stat(Icons.visibility, s['visitors'], context.tt('Views', 'व्यू'), () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfileListScreen(kind: 'visitors')))),
                  _stat(Icons.favorite, s['shortlisted'], context.tt('Shortlist', 'शॉर्टलिस्ट'), () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProfileListScreen(kind: 'shortlist')))),
                ]),
              ),
            ),
            SliverToBoxAdapter(child: Padding(padding: const EdgeInsets.only(top: 16), child: BannerCarousel(placement: 'app_home', onInternalLink: _internalLink))),
            if (!app.isPremium)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(gradient: MsrColors.royal, borderRadius: BorderRadius.circular(18)),
                    child: Row(children: [
                      const Icon(Icons.workspace_premium, color: MsrColors.goldLight, size: 40),
                      const SizedBox(width: 12),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(context.tt('Go Premium', 'प्रीमियम बनें'), style: displayStyle(18, color: Colors.white)),
                        Text(context.tt('View numbers & chat with anyone', 'नंबर देखें और किसी से भी चैट करें'), style: const TextStyle(color: Colors.white70, fontSize: 12)),
                      ])),
                      GoldButton(label: context.tt('Plans', 'प्लान'), onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PlansScreen()))),
                    ]),
                  ),
                ),
              ),
            SliverToBoxAdapter(child: SectionTitle(context.tt('Recommended for you', 'आपके लिए सुझाव'), trailing: TextButton(onPressed: () => MainShell.goTab(context, 1), child: Text(context.tt('See all', 'सभी देखें'))))),
            SliverToBoxAdapter(
              child: recs == null
                  ? const Loading()
                  : recs!.isEmpty
                      ? EmptyState(icon: Icons.auto_awesome, title: context.tt('No recommendations yet', 'अभी कोई सुझाव नहीं'))
                      : ProfileGrid(items: recs!, shrinkWrap: true),
            ),
          ],
        ]),
      ),
    );
  }

  Widget _notice(IconData icon, String text, Color bg) => Container(
        margin: const EdgeInsets.fromLTRB(16, 14, 16, 0),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(14)),
        child: Row(children: [Icon(icon, color: MsrColors.maroon), const SizedBox(width: 10), Expanded(child: Text(text, style: const TextStyle(fontSize: 13)))]),
      );

  Widget _stat(IconData icon, dynamic v, String label, VoidCallback onTap) => Expanded(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: Card(
            child: InkWell(
              borderRadius: BorderRadius.circular(18),
              onTap: onTap,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Column(children: [
                  Icon(icon, color: MsrColors.gold, size: 22),
                  const SizedBox(height: 4),
                  Text('${v ?? 0}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
                  Text(label, style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
                ]),
              ),
            ),
          ),
        ),
      );
}
