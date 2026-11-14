import 'dart:async';
import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';
import '../core/labels.dart';
import '../core/theme.dart';
import '../services/api.dart';
import '../services/app_state.dart';
import '../widgets/common.dart';
import 'chat_screen.dart';

class ChatsTab extends StatefulWidget {
  const ChatsTab({super.key});
  @override
  State<ChatsTab> createState() => _ChatsTabState();
}

class _ChatsTabState extends State<ChatsTab> {
  List? items;
  StreamSubscription? sub;

  @override
  void initState() {
    super.initState();
    _load();
    sub = context.read<AppState>().messages.listen((_) => _load());
  }

  @override
  void dispose() {
    sub?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final r = await Api.I.get('/chat/conversations');
      if (mounted) setState(() => items = r['items']);
    } catch (_) {
      if (mounted) setState(() => items = []);
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<AppState>().lang;
    return Scaffold(
      appBar: AppBar(title: Text(context.tt('Messages', 'संदेश'))),
      body: items == null
          ? const Loading()
          : RefreshIndicator(
              onRefresh: _load,
              child: items!.isEmpty
                  ? ListView(children: [EmptyState(icon: Icons.chat_bubble_outline, title: context.tt('No conversations yet', 'अभी कोई बातचीत नहीं'), text: context.tt('Chat unlocks when an interest is accepted.', 'रुचि स्वीकार होने पर चैट शुरू होगी।'))])
                  : ListView.separated(
                      itemCount: items!.length,
                      separatorBuilder: (_, _) => const Divider(height: 1, indent: 80),
                      itemBuilder: (_, i) {
                        final c = items![i];
                        final unread = (c['unread'] ?? 0) as int;
                        return ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                          leading: Stack(children: [
                            CircleAvatar(radius: 26, child: ClipOval(child: SizedBox(width: 52, height: 52, child: ProfileImage(url: c['profile']?['photo'])))),
                            if (c['isOnline'] == true) Positioned(right: 0, bottom: 0, child: Container(width: 13, height: 13, decoration: BoxDecoration(color: MsrColors.green, shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 2)))),
                          ]),
                          title: Text(c['profile']?['fullName'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                          subtitle: Text('${c['lastSenderIsMe'] == true ? '${context.tt('You', 'आप')}: ' : ''}${c['lastMessage'] ?? ''}', maxLines: 1, overflow: TextOverflow.ellipsis,
                              style: TextStyle(fontWeight: unread > 0 ? FontWeight.w600 : FontWeight.normal)),
                          trailing: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.end, children: [
                            Text(timeAgo(c['lastMessageAt'], lang), style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
                            if (unread > 0) Container(margin: const EdgeInsets.only(top: 4), padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2), decoration: BoxDecoration(color: MsrColors.saffron, borderRadius: BorderRadius.circular(10)), child: Text('$unread', style: const TextStyle(color: Colors.white, fontSize: 11))),
                          ]),
                          onTap: () async {
                            await Navigator.push(context, MaterialPageRoute(builder: (_) => ChatScreen(userId: c['otherUserId'].toString())));
                            _load();
                            if (context.mounted) context.read<AppState>().refreshCounts();
                          },
                        );
                      },
                    ),
            ),
    );
  }
}
