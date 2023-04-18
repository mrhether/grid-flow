import { Solver, Variable, Strength, Constraint, Operator } from "@lume/kiwi";

const COLLAPSE_SPACING = false;

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
    solver.addEditVariable(this.height, Strength.strong);

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

export function relayoutWidgets(widgets: Widget[]): Widget[] {
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
      // If there are widgets above this widget, ensure it's y is at least the y of the widget above it + the height of the widget above it + the spacing between the widgets
      widgetsAbove.forEach((widgetAbove) => {
        const widgetAboveVariable = widgetVariables[widgetAbove.id];
        const spacingBetweenWidgets =
          widgetAbove.hidden && COLLAPSE_SPACING
            ? 0
            : Math.max(widget.y - (widgetAbove.y + widgetAbove.height), 0);
        solver.addConstraint(
          new Constraint(
            widgetVariable.y,
            Operator.Ge,
            widgetAboveVariable.y
              .plus(widgetAboveVariable.height)
              .plus(spacingBetweenWidgets),
            Strength.medium
          )
        );
      });
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
