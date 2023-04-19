import { Solver, Variable, Strength, Constraint, Operator } from "@lume/kiwi";

export interface Widget {
  x: number;
  y: number;
  width: number;
  height: number;
  hidden?: boolean;
  id: string;
}

class WidgetVariable {
  private widget: Widget;

  public y: Variable;
  public height: Variable;

  constructor(widget: Widget, solver: Solver) {
    this.widget = widget;
    this.y = new Variable(widget.id + ".y");
    this.height = new Variable(widget.id + ".height");

    solver.addEditVariable(this.y, Strength.weak);

    solver.addConstraint(
      new Constraint(
        this.height,
        Operator.Eq,
        !widget.hidden ? widget.height : 0
      )
    );

    // Ensure Y can't go below 0
    solver.addConstraint(new Constraint(this.y, Operator.Ge, 0));
  }

  toWidget(): Widget {
    return {
      ...this.widget,
      y: this.y.value(),
      height: this.height.value(),
    };
  }
}

type Options = {
  collapseSpacing?: boolean;
  measureOnlyNearestAbove?: boolean;
};

const DefaultOptions: Options = {
  collapseSpacing: true,
  measureOnlyNearestAbove: true,
};

export function layoutWidgets(
  widgets: Widget[],
  _options: Options = {}
): Widget[] {
  const options = { ...DefaultOptions, ..._options };
  sort(widgets);

  const { widgetVariables, solver } = createSolver(widgets);

  // Create a map of widgets above each widget (raycast to the above)
  const widgetAboveMap = createAboveMap(widgets);

  // For each widget add spacing constraints between it and all direct widgets above it
  widgets.forEach((widget) => {
    const widgetVariable = widgetVariables[widget.id];
    const widgetsAbove = widgetAboveMap[widget.id] ?? [];

    if (widgetsAbove.length === 0) {
      // If there are no widgets above this widget, ensure it's y is at least 0
      solver.addConstraint(
        new Constraint(widgetVariable.y, Operator.Ge, widget.y, Strength.medium)
      );
    } else {
      const addSpacingConstraint = (widgetA: Widget, widgetB: Widget) => {
        const widgetAV = widgetVariables[widgetA.id];
        const widgetBV = widgetVariables[widgetB.id];
        const spacingBetweenWidgets =
          widgetB.hidden && options.collapseSpacing
            ? 0
            : Math.max(widgetA.y - (widgetB.y + widgetB.height), 0);
        solver.addConstraint(
          new Constraint(
            widgetAV.y,
            Operator.Ge,
            widgetBV.y.plus(widgetBV.height).plus(spacingBetweenWidgets),
            Strength.medium
          )
        );
      };

      if (options.measureOnlyNearestAbove) {
        const closestWidgetsAbove = widgetsAbove.reduce(
          (closest, widgetAbove) => {
            const wBottom = widgetAbove.y + widgetAbove.height;
            const cBottom =
              closest.length > 0 ? closest[0].y + closest[0].height : -Infinity;
            if (wBottom === cBottom) return [...closest, widgetAbove];
            return wBottom > cBottom ? [widgetAbove] : closest;
          },
          [] as Widget[]
        );
        closestWidgetsAbove.forEach(addSpacingConstraint.bind(null, widget));
      } else {
        widgetsAbove.forEach(addSpacingConstraint.bind(null, widget));
      }
    }
  });

  // For each widget add constraints to ensure it doesn't overlap with any widgets above it
  widgets.forEach((widget, i) => {
    const widgetVariable = widgetVariables[widget.id];
    for (let j = i - 1; j >= 0; j--) {
      const widgetAbove = widgets[j];
      const widgetAboveVariable = widgetVariables[widgetAbove.id];

      if (hasXOverlap(widget, widgetAbove) && !widgetAbove.hidden) {
        solver.addConstraint(
          new Constraint(
            widgetVariable.y,
            Operator.Ge,
            widgetAboveVariable.y.plus(widgetAbove.height)
          )
        );
      }
    }
  });

  solver.updateVariables();

  return widgets.map((widget) => widgetVariables[widget.id].toWidget());
}

function hasXOverlap(currentWidget: Widget, widgetAbove: Widget) {
  return (
    currentWidget.x < widgetAbove.x + widgetAbove.width &&
    currentWidget.x + currentWidget.width > widgetAbove.x
  );
}

function sort(widgets: Widget[]) {
  widgets.sort((a, b) => {
    if (a.y !== b.y) {
      return a.y - b.y;
    } else {
      return a.x - b.x;
    }
  });
}

function createSolver(widgets: Widget[]) {
  const solver = new Solver();
  const widgetVariables = widgets.reduce(
    (acc, widget) => ({
      ...acc,
      [widget.id]: new WidgetVariable(widget, solver),
    }),
    {} as { [key: string]: WidgetVariable }
  );
  return { widgetVariables, solver };
}

function createAboveMap(widgets: Widget[]) {
  const widgetAboveMap = {} as { [key: string]: Widget[] };
  widgets.forEach((widget, i) => {
    for (let j = 0; j < i; j++) {
      const widgetAbove = widgets[j];
      if (hasXOverlap(widget, widgetAbove)) {
        widgetAboveMap[widget.id] = widgetAboveMap[widget.id] ?? [];
        widgetAboveMap[widget.id].push(widgetAbove);

        // Remove all widgets from the above map that this above map already has
        widgetAboveMap[widget.id] = widgetAboveMap[widget.id].filter(
          (w) => (widgetAboveMap[widgetAbove.id] ?? []).indexOf(w) === -1
        );
      }
    }
  });
  return widgetAboveMap;
}
