import 'package:app_ui_kit/app_ui_kit.dart';
import 'package:flutter/material.dart';
import 'package:fom_mobile/app/router/app_route_paths.dart';
import 'package:go_router/go_router.dart';

class OrdersHomePage extends StatelessWidget {
  const OrdersHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(8.0),
          child: Column(
            mainAxisAlignment: .center,
            spacing: 10,
            children: [
              Text('Orders', style: Theme.of(context).textTheme.bodyLarge),
              AppButton(
                text: "Go To DevTools",
                onPressed: () {
                  context.push(AppRoutePaths.devtoolsLogs);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
