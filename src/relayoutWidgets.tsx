export interface Widget {
  x: number;
  y: number;
  width: number;
  height: number;
  hidden?: boolean;
  id: string;
}

function hasOverlap(a: Widget, b: Widget): boolean {
  const horizontalOverlap = a.x < b.x + b.width && a.x + a.width > b.x;
  const verticalOverlap = a.y < b.y + b.height && a.y + a.height > b.y;
  return horizontalOverlap && verticalOverlap;
}

function moveWidgetBelow(a: Widget, b: Widget): void {
  a.y = b.y + b.height;
}

function hasXOverlap(currentWidget: Widget, widgetAbove: Widget) {
  return (
    currentWidget.x < widgetAbove.x + widgetAbove.width &&
    currentWidget.x + currentWidget.width > widgetAbove.x
  );
}

export function relayoutWidgets(widgets: Widget[]): Widget[] {
  widgets.sort((a, b) => {
    if (a.y !== b.y) {
      return a.y - b.y;
    } else {
      return a.x - b.x;
    }
  });

  // expandGrowingChildren(widgets);
  collapseHidden(widgets);
  // expandGrowingChildren(widgets);
  return widgets;
}

function expandGrowingChildren(widgets: Widget[]) {
  let hasOverlapFound: boolean;
  do {
    hasOverlapFound = false;
    for (let i = 0; i < widgets.length; i++) {
      for (let j = i + 1; j < widgets.length; j++) {
        if (hasOverlap(widgets[i], widgets[j]) && !widgets[j].hidden) {
          hasOverlapFound = true;
          moveWidgetBelow(widgets[j], widgets[i]);
        }
      }
    }
  } while (hasOverlapFound);
}

function collapseHidden(widgets: Widget[]) {
  const movedUpWidgets = new Set<Widget>();
  for (let i = 0; i < widgets.length; i++) {
    const currentWidget = widgets[i];
    // Check if any widgets above are hidden
    let lowestVisibleAbove = undefined as Widget | undefined;
    let lowestHiddenAbove = undefined as Widget | undefined;
    for (let j = i - 1; j >= 0; j--) {
      const widgetAbove = widgets[j];

      const horizontalOverlap = hasXOverlap(currentWidget, widgetAbove);
      const isAbove = widgetAbove.y + widgetAbove.height <= currentWidget.y;

      if (horizontalOverlap && isAbove) {
        if (widgetAbove.hidden || movedUpWidgets.has(widgetAbove)) {
          if (!lowestHiddenAbove) {
            lowestHiddenAbove = widgetAbove;
          } else if (
            lowestHiddenAbove.y + lowestHiddenAbove.height <
            widgetAbove.y + widgetAbove.height
          ) {
            lowestHiddenAbove = widgetAbove;
          }
        } else {
          if (!lowestVisibleAbove) {
            lowestVisibleAbove = widgetAbove;
          } else if (
            lowestVisibleAbove.y + lowestVisibleAbove.height <
            widgetAbove.y + widgetAbove.height
          ) {
            lowestVisibleAbove = widgetAbove;
          }
        }
      }
    }

    if (
      lowestHiddenAbove &&
      lowestVisibleAbove &&
      lowestHiddenAbove.y + lowestHiddenAbove.height >
        lowestVisibleAbove?.y + lowestVisibleAbove.height
    ) {
      currentWidget.y = Math.max(0, currentWidget.y - lowestHiddenAbove.height);
      movedUpWidgets.add(currentWidget);
    }
    if (lowestHiddenAbove && !lowestVisibleAbove) {
      currentWidget.y = Math.max(0, currentWidget.y - lowestHiddenAbove.height);
      movedUpWidgets.add(currentWidget);
    }
  }
}
