import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/home/presentation/screens/home_screen.dart';
import '../../features/trending/presentation/screens/trending_screen.dart';
import '../../features/swap/presentation/screens/swap_screen.dart';
import '../../features/rewards/presentation/screens/rewards_screen.dart';
import '../../features/discover/presentation/screens/discover_screen.dart';
import '../../features/settings/presentation/screens/settings_screen.dart';
import '../../features/token_detail/presentation/screens/token_detail_screen.dart';
import '../../features/send/presentation/screens/send_screen.dart';
import '../../features/receive/presentation/screens/receive_screen.dart';
import '../../features/onboarding/presentation/screens/splash_screen.dart';
import '../../features/onboarding/presentation/screens/welcome_screen.dart';
import '../../features/onboarding/presentation/screens/create_wallet_screen.dart';
import '../../features/onboarding/presentation/screens/import_wallet_screen.dart';
import '../../shared/models/token_model.dart';
import 'scaffold_with_nav_bar.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/splash',
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/welcome',
        builder: (context, state) => const WelcomeScreen(),
      ),
      GoRoute(
        path: '/create-wallet',
        builder: (context, state) => const CreateWalletScreen(),
      ),
      GoRoute(
        path: '/import-wallet',
        builder: (context, state) => const ImportWalletScreen(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return ScaffoldWithNavBar(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/home',
                builder: (context, state) => const HomeScreen(),
                routes: [
                  GoRoute(
                    path: 'token/:id',
                    builder: (context, state) {
                      final token = state.extra as TokenModel?;
                      return TokenDetailScreen(token: token!);
                    },
                  ),
                  GoRoute(
                    path: 'send',
                    builder: (context, state) => const SendScreen(),
                  ),
                  GoRoute(
                    path: 'receive',
                    builder: (context, state) => const ReceiveScreen(),
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/trending',
                builder: (context, state) => const TrendingScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/swap',
                builder: (context, state) => const SwapScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/rewards',
                builder: (context, state) => const RewardsScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/discover',
                builder: (context, state) => const DiscoverScreen(),
                routes: [
                  GoRoute(
                    path: 'settings',
                    builder: (context, state) => const SettingsScreen(),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  );
});
