import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../tokens/app_colors.dart';

/// A horizontal scrollable tab bar for filtering categories with a sliding pill indicator.
class AppFilterTabs extends StatefulWidget {
  const AppFilterTabs({
    required this.tabs,
    required this.selectedIndex,
    required this.onTabSelected,
    super.key,
  });

  /// The list of tab labels (e.g., "All (23)", "Pending (8)").
  final List<String> tabs;

  /// The currently selected tab index.
  final int selectedIndex;

  /// Callback when a tab is selected.
  final ValueChanged<int> onTabSelected;

  @override
  State<AppFilterTabs> createState() => _AppFilterTabsState();
}

class _AppFilterTabsState extends State<AppFilterTabs> {
  final List<GlobalKey> _keys = [];
  double _indicatorLeft = 0;
  double _indicatorWidth = 0;
  bool _isInitial = true;

  @override
  void initState() {
    super.initState();
    _keys.addAll(List.generate(widget.tabs.length, (index) => GlobalKey()));
    WidgetsBinding.instance.addPostFrameCallback((_) => _updateIndicator());
  }

  @override
  void didUpdateWidget(AppFilterTabs oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.selectedIndex != widget.selectedIndex ||
        oldWidget.tabs.length != widget.tabs.length) {
      if (oldWidget.tabs.length != widget.tabs.length) {
        _keys.clear();
        _keys.addAll(List.generate(widget.tabs.length, (index) => GlobalKey()));
      }
      WidgetsBinding.instance.addPostFrameCallback((_) => _updateIndicator());
    }
  }

  void _updateIndicator() {
    if (!mounted || _keys.isEmpty) return;

    final selectedKey = _keys[widget.selectedIndex];
    final RenderBox? renderBox =
        selectedKey.currentContext?.findRenderObject() as RenderBox?;
    final RenderBox? stackBox = context.findRenderObject() as RenderBox?;

    if (renderBox != null && stackBox != null) {
      final position = renderBox.localToGlobal(Offset.zero, ancestor: stackBox);
      setState(() {
        _indicatorLeft = position.dx;
        _indicatorWidth = renderBox.size.width;
        _isInitial = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 44,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Stack(
          children: [
            // Sliding Pill Indicator
            AnimatedPositioned(
              duration: _isInitial ? Duration.zero : 300.ms,
              curve: Curves.easeOutCubic,
              left: _indicatorLeft,
              width: _indicatorWidth,
              top: 0,
              bottom: 0,
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.cream,
                  border: Border.all(color: AppColors.border, width: 2),
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(16),
                  ),
                ),
              ),
            ),
            // Tab Labels
            Row(
              children: List.generate(widget.tabs.length, (index) {
                final isSelected = index == widget.selectedIndex;
                return Padding(
                  padding: EdgeInsets.only(left: index == 0 ? 0 : 8),
                  child: _FilterTab(
                    key: _keys[index],
                    label: widget.tabs[index],
                    isSelected: isSelected,
                    onTap: () => widget.onTabSelected(index),
                  ),
                );
              }),
            ),
          ],
        ),
      ),
    );
  }
}

class _FilterTab extends StatelessWidget {
  const _FilterTab({
    required this.label,
    required this.isSelected,
    required this.onTap,
    super.key,
  });

  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Center(
            child: Animate(target: isSelected ? 1 : 0).custom(
              duration: 250.ms,
              builder: (context, value, _) {
                final textColor = Color.lerp(
                  AppColors.textLight,
                  AppColors.softOrange,
                  value,
                );
                return Text(
                  label,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: textColor,
                  ),
                );
              },
            ),
          ),
        ),
      ),
    );
  }
}
