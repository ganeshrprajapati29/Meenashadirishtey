import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';
import '../core/theme.dart';
import '../services/api.dart';
import '../services/app_state.dart';
import '../widgets/common.dart';
import 'chat_screen.dart';
import 'profile_detail_screen.dart';

class InterestsTab extends StatelessWidget {
  const InterestsTab({super.key});
  @override
  Widget build(BuildContext context) {
    context.watch<AppState>();
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        appBar: AppBar(
          title: Text(context.tt('Interests', 'रुचि')),
          bottom: TabBar(
            isScrollable: true,
            labelColor: MsrColors.goldLight,
            unselectedLabelColor: Colors.white70,
            indicatorColor: MsrColors.goldLight,
            tabAlignment: TabAlignment.start,
            tabs: [
              Tab(text: context.tt('Received', 'प्राप्त')),
              Tab(text: context.tt('Sent', 'भेजी गई')),
              Tab(text: context.tt('Connected', 'जुड़े हुए')),
              Tab(text: context.tt('Declined', 'अस्वीकृत')),
            ],
          ),
        ),
        body: const TabBarView(children: [_List('received'), _List('sent'), _List('accepted'), _List('declined')]),
      ),
    );
  }
}

class _List extends StatefulWidget {
  final String tab;
  const _List(this.tab);
  @override
  State<_List> createState() => _ListState();
}

class _ListState extends State<_List> with AutomaticKeepAliveClientMixin {
  List? items;
  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final r = await Api.I.get('/interests', {'tab': widget.tab});
      if (mounted) setState(() => items = r['items']);
    } catch (_) {
      if (mounted) setState(() => items = []);
    }
  }

  Future<void> _act(String id, String action) async {
    try {
      if (action == 'cancel') {
        await Api.I.delete('/interests/$id');
      } else {
        await Api.I.patch('/interests/$id', {'action': action});
      }
      if (mounted) context.toast(action == 'accept' ? context.tt('Accepted 🎉', 'स्वीकार किया 🎉') : context.tt('Done', 'हो गया'));
      _load();
    } on ApiException catch (e) {
      if (mounted) context.toast(e.message, error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    if (items == null) return const Loading();
    return RefreshIndicator(
      onRefresh: _load,
      child: items!.isEmpty
          ? ListView(children: [EmptyState(icon: Icons.inbox, title: context.tt('Nothing here yet', 'अभी यहाँ कुछ नहीं'))])
          : ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: items!.length,
              separatorBuilder: (_, _) => const SizedBox(height: 10),
              itemBuilder: (_, i) {
                final it = items![i];
                final p = it['profile'];
                return Card(
                  child: InkWell(
                    borderRadius: BorderRadius.circular(18),
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ProfileDetailScreen(id: p['profileId']))),
                    child: Padding(
                      padding: const EdgeInsets.all(10),
                      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        ClipRRect(borderRadius: BorderRadius.circular(12), child: SizedBox(width: 84, height: 104, child: ProfileImage(url: p['photo'], gender: p['gender'], blur: p['photoLocked'] == true ? 8 : 0))),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text('${p['firstName']} ${p['lastName'] ?? ''}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: MsrColors.maroon)),
                            Text('${p['profileId']} · ${p['age']} ${context.tt('yrs', 'वर्ष')} · ${p['gotra']}', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                            Text([p['education'], p['occupation'], p['district']].where((e) => e != null).join(' · '), maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12)),
                            if (it['message'] != null) Padding(padding: const EdgeInsets.only(top: 4), child: Text('“${it['message']}”', style: const TextStyle(fontStyle: FontStyle.italic, fontSize: 12))),
                            const SizedBox(height: 8),
                            Wrap(spacing: 8, children: [
                              if (widget.tab == 'received') ...[
                                FilledButton.tonal(onPressed: () => _act(it['id'], 'accept'), child: Text(context.tt('Accept', 'स्वीकार'))),
                                OutlinedButton(onPressed: () => _act(it['id'], 'decline'), child: Text(context.tt('Decline', 'अस्वीकार'))),
                              ],
                              if (widget.tab == 'sent') OutlinedButton(onPressed: () => _act(it['id'], 'cancel'), child: Text(context.tt('Withdraw', 'वापस लें'))),
                              if (widget.tab == 'accepted')
                                GoldButton(label: context.tt('Chat', 'चैट'), icon: Icons.chat, onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ChatScreen(userId: p['userId'].toString())))),
                            ]),
                          ]),
                        ),
                      ]),
                    ),
                  ),
                );
              },
            ),
    );
  }
}
