import 'package:app_logger/app_logger.dart';
import 'package:flutter/material.dart';
import 'package:talker_flutter/talker_flutter.dart';

class LogsDevtoolsPage extends StatelessWidget {
  const LogsDevtoolsPage({required this.logger, super.key});

  final AppLogger logger;

  @override
  Widget build(BuildContext context) {
    return TalkerScreen(talker: logger.talker);
  }
}
