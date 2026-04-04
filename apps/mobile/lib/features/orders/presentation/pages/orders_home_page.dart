import 'package:flutter/material.dart';
import 'package:fom_mobile/app/router/app_route_paths.dart';
import 'package:go_router/go_router.dart';

class OrdersHomePage extends StatelessWidget {
  const OrdersHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: .center,
          spacing: 10,
          children: [
            Text('Orders', style: Theme.of(context).textTheme.bodyLarge),
            ElevatedButton(
              onPressed: () {
                context.push(AppRoutePaths.devtoolsLogs);
              },
              child: const Text('Go To DevTools'),
            ),
          ],
        ),
      ),
    );
  }
}
