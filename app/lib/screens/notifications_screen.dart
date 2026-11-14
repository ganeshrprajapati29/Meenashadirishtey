import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';
import '../core/labels.dart';
import '../core/theme.dart';
import '../services/api.dart';
import '../services/app_state.dart';
import '../widgets/common.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});
  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List? items;
  static const icons = {
    'interest_received': Icons.favorite, 'interest_accepted': Icons.favorite, 'interest_declined': Icons.heart_broken, 'message': Icons.chat,
    'profile_view': Icons.visibility, 'profile_approved': Icons.verified, 'profile_rejected': Icons.error, 'premium': Icons.workspace_premium,
  };

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final r = await Api.I.get('/notifications', {'limit': 50});
    if (mounted) setState(() => items = r['items']);
    await Api.I.patch('/notifications/read-all');
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<AppState>().lang;
    return Scaffold(
      appBar: AppBar(title: Text(context.tt('Notifications', 'सूचनाएं'))),
      body: items == null
          ? const Loading()
          : items!.isEmpty
              ? EmptyState(icon: Icons.notifications_none, title: context.tt('No notifications', 'कोई सूचना नहीं'))
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.separated(
                    itemCount: items!.length,
                    separatorBuilder: (_, _) => const Divider(height: 1),
                    itemBuilder: (_, i) {
                      final n = items![i];
                      return ListTile(
                        tileColor: n['read'] == true ? null : MsrColors.goldPale,
                        leading: CircleAvatar(backgroundColor: MsrColors.maroonLight, child: Icon(icons[n['type']] ?? Icons.info, color: MsrColors.maroon, size: 20)),
                        title: Text(n['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: Text('${n['body'] ?? ''}\n${timeAgo(n['createdAt'], lang)}'),
                        isThreeLine: true,
                      );
                    },
                  ),
                ),
    );
  }
}
