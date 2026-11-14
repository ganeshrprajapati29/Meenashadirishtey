import 'dart:async';
import 'package:intl/intl.dart';
import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';
import '../core/labels.dart';
import '../core/theme.dart';
import '../services/api.dart';
import '../services/app_state.dart';
import '../widgets/common.dart';
import 'plans_screen.dart';

class ChatScreen extends StatefulWidget {
  final String userId;
  const ChatScreen({super.key, required this.userId});
  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  Map? other;
  bool canChat = false;
  List<Map<String, dynamic>> msgs = [];
  bool loading = true;
  bool typing = false;
  final ctrl = TextEditingController();
  final scroll = ScrollController();
  StreamSubscription? s1, s2;
  Timer? typingTimer;
  late final AppState app = context.read<AppState>();

  @override
  void initState() {
    super.initState();
    _load();
    s1 = app.messages.listen((m) {
      final from = m['sender'].toString();
      if (from == widget.userId || from == app.myId) {
        if (msgs.any((x) => x['_id'] == m['_id'])) return;
        setState(() {
          msgs.removeWhere((x) => x['pending'] == true && x['text'] == m['text'] && from == app.myId);
          msgs.add(m);
        });
        _bottom();
        if (from == widget.userId) app.emit('message:read', {'with': widget.userId});
      }
    });
    s2 = app.events.listen((e) {
      final d = e.value is Map ? Map<String, dynamic>.from(e.value) : <String, dynamic>{};
      if (e.key == 'typing' && d['from'].toString() == widget.userId) setState(() => typing = d['typing'] == true);
      if (e.key == 'presence' && d['userId'].toString() == widget.userId && other != null) setState(() => other!['isOnline'] = d['isOnline']);
      if (e.key == 'message:read' && d['by'].toString() == widget.userId) {
        setState(() { for (final m in msgs) { if (m['sender'].toString() == app.myId) m['readAt'] ??= DateTime.now().toIso8601String(); } });
      }
    });
  }

  @override
  void dispose() {
    s1?.cancel();
    s2?.cancel();
    typingTimer?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final r = await Api.I.get('/chat/${widget.userId}/messages');
      setState(() {
        other = Map.from(r['other']);
        canChat = r['canChat'] == true;
        msgs = List<Map<String, dynamic>>.from((r['items'] as List).map((e) => Map<String, dynamic>.from(e)));
        loading = false;
      });
      _bottom();
      app.refreshCounts();
    } on ApiException catch (e) {
      if (mounted) {
        context.toast(e.message, error: true);
        Navigator.pop(context);
      }
    }
  }

  void _bottom() => WidgetsBinding.instance.addPostFrameCallback((_) {
        if (scroll.hasClients) scroll.animateTo(scroll.position.maxScrollExtent, duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
      });

  Future<void> _send() async {
    final text = ctrl.text.trim();
    if (text.isEmpty) return;
    ctrl.clear();
    final temp = {'_id': 'tmp${DateTime.now().millisecondsSinceEpoch}', 'text': text, 'sender': app.myId, 'createdAt': DateTime.now().toIso8601String(), 'pending': true};
    setState(() => msgs.add(temp));
    _bottom();
    app.emit('typing', {'to': widget.userId, 'typing': false});
    try {
      final m = await app.sendMessage(widget.userId, text);
      setState(() {
        final i = msgs.indexWhere((x) => x['_id'] == temp['_id']);
        if (i >= 0) {
          if (msgs.any((x) => x['_id'] == m['_id'])) {
            msgs.removeAt(i);
          } else {
            msgs[i] = m;
          }
        }
      });
    } on ApiException catch (e) {
      setState(() => msgs.removeWhere((x) => x['_id'] == temp['_id']));
      if (mounted) context.toast(e.message, error: true);
    }
  }

  void _onType(String v) {
    app.emit('typing', {'to': widget.userId, 'typing': true});
    typingTimer?.cancel();
    typingTimer = Timer(const Duration(milliseconds: 1500), () => app.emit('typing', {'to': widget.userId, 'typing': false}));
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<AppState>().lang;
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: other == null
            ? const SizedBox()
            : Row(children: [
                CircleAvatar(radius: 19, child: ClipOval(child: SizedBox(width: 38, height: 38, child: ProfileImage(url: other!['photo'])))),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(other!['fullName'] ?? '', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                    Text(typing ? context.tt('typing…', 'लिख रहे हैं…') : other!['isOnline'] == true ? context.tt('Online', 'ऑनलाइन') : '${context.tt('Last seen', 'आखिरी बार')} ${timeAgo(other!['lastActive'], lang)}',
                        style: const TextStyle(fontSize: 11, color: MsrColors.goldLight)),
                  ]),
                ),
              ]),
      ),
      body: loading
          ? const Loading()
          : Column(children: [
              Expanded(
                child: Container(
                  color: MsrColors.cream,
                  child: msgs.isEmpty
                      ? Center(child: Text(context.tt('Say Namaste 🙏', 'नमस्ते 🙏 कहें'), style: TextStyle(color: Colors.grey.shade600)))
                      : ListView.builder(
                          controller: scroll,
                          padding: const EdgeInsets.all(12),
                          itemCount: msgs.length,
                          itemBuilder: (_, i) {
                            final m = msgs[i];
                            final mine = m['sender'].toString() == app.myId;
                            final t = DateTime.tryParse(m['createdAt'].toString())?.toLocal();
                            return Align(
                              alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
                              child: Container(
                                constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * .78),
                                margin: const EdgeInsets.symmetric(vertical: 3),
                                padding: const EdgeInsets.fromLTRB(14, 8, 10, 6),
                                decoration: BoxDecoration(
                                  color: mine ? MsrColors.maroon : Colors.white,
                                  borderRadius: BorderRadius.only(topLeft: const Radius.circular(16), topRight: const Radius.circular(16), bottomLeft: Radius.circular(mine ? 16 : 4), bottomRight: Radius.circular(mine ? 4 : 16)),
                                  boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: .05), blurRadius: 4)],
                                ),
                                child: Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                                  Text(m['text'] ?? '', style: TextStyle(color: mine ? Colors.white : MsrColors.ink)),
                                  const SizedBox(height: 2),
                                  Row(mainAxisSize: MainAxisSize.min, children: [
                                    Text(t == null ? '' : DateFormat('hh:mm a').format(t), style: TextStyle(fontSize: 10, color: mine ? Colors.white70 : Colors.grey)),
                                    if (mine) ...[
                                      const SizedBox(width: 4),
                                      Icon(m['pending'] == true ? Icons.schedule : m['readAt'] != null ? Icons.done_all : Icons.done, size: 13, color: m['readAt'] != null ? MsrColors.goldLight : Colors.white70),
                                    ],
                                  ]),
                                ]),
                              ),
                            );
                          },
                        ),
                ),
              ),
              SafeArea(
                top: false,
                child: canChat
                    ? Padding(
                        padding: const EdgeInsets.fromLTRB(10, 8, 10, 8),
                        child: Row(children: [
                          Expanded(
                            child: TextField(
                              controller: ctrl,
                              minLines: 1,
                              maxLines: 4,
                              onChanged: _onType,
                              decoration: InputDecoration(hintText: context.tt('Type a message…', 'संदेश लिखें…'), border: OutlineInputBorder(borderRadius: BorderRadius.circular(30)), enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(30), borderSide: BorderSide(color: Colors.brown.shade100))),
                            ),
                          ),
                          const SizedBox(width: 8),
                          FloatingActionButton.small(heroTag: 'send', backgroundColor: MsrColors.maroon, onPressed: _send, child: const Icon(Icons.send, color: Colors.white)),
                        ]),
                      )
                    : Container(
                        color: MsrColors.goldPale,
                        padding: const EdgeInsets.all(14),
                        child: Row(children: [
                          Expanded(child: Text(context.tt('Chat unlocks when your interest is accepted, or with premium.', 'रुचि स्वीकार होने पर या प्रीमियम से चैट खुलेगी।'), style: const TextStyle(fontSize: 13))),
                          GoldButton(label: context.tt('Upgrade', 'अपग्रेड'), onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PlansScreen()))),
                        ]),
                      ),
              ),
            ]),
    );
  }
}
