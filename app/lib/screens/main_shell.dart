import 'package:material_ui/material_ui.dart';
import 'package:provider/provider.dart';
import '../services/app_state.dart';
import '../widgets/common.dart';
import 'home_tab.dart';
import 'matches_tab.dart';
import 'interests_tab.dart';
import 'chats_tab.dart';
import 'account_tab.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});
  static void goTab(BuildContext context, int i) => context.findAncestorStateOfType<_MainShellState>()?.setTab(i);
  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int tab = 0;
  void setTab(int i) => setState(() => tab = i);

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppState>();
    Widget badge(IconData icon, int n) => Badge(isLabelVisible: n > 0, label: Text('$n'), child: Icon(icon));
    return Scaffold(
      body: IndexedStack(index: tab, children: const [HomeTab(), MatchesTab(), InterestsTab(), ChatsTab(), AccountTab()]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: tab,
        onDestinationSelected: setTab,
        destinations: [
          NavigationDestination(icon: const Icon(Icons.home_outlined), selectedIcon: const Icon(Icons.home), label: context.tt('Home', 'होम')),
          NavigationDestination(icon: const Icon(Icons.search), label: context.tt('Matches', 'रिश्ते')),
          NavigationDestination(icon: const Icon(Icons.favorite_border), selectedIcon: const Icon(Icons.favorite), label: context.tt('Interests', 'रुचि')),
          NavigationDestination(icon: badge(Icons.chat_bubble_outline, app.unreadMessages), selectedIcon: badge(Icons.chat_bubble, app.unreadMessages), label: context.tt('Chats', 'चैट')),
          NavigationDestination(icon: const Icon(Icons.person_outline), selectedIcon: const Icon(Icons.person), label: context.tt('Account', 'अकाउंट')),
        ],
      ),
    );
  }
}
