import { flattenDeep } from "lodash";
import * as React from "react";
import { Optional } from "utility-types";
import { v4 as uuidv4 } from "uuid";
import {
  Action,
  ActionContext,
  CommandBarAction,
  MenuItemButton,
  MenuItemWithChildren,
} from "~/types";

function resolve<T>(value: any, context: ActionContext): T {
  return typeof value === "function" ? value(context) : value;
}

export function createAction(definition: Optional<Action, "id">): Action {
  return {
    ...definition,
    id: uuidv4(),
  };
}

export function actionToMenuItem(
  action: Action,
  context: ActionContext
): MenuItemButton | MenuItemWithChildren {
  const resolvedIcon = resolve<React.ReactElement<any>>(action.icon, context);
  const resolvedChildren = resolve<Action[]>(action.children, context);
  const visible = action.visible ? action.visible(context) : true;
  const title = resolve<string>(action.name, context);
  const icon =
    resolvedIcon && action.iconInContextMenu !== false
      ? React.cloneElement(resolvedIcon, {
          color: "currentColor",
        })
      : undefined;

  if (resolvedChildren) {
    const items = resolvedChildren
      .map((a) => actionToMenuItem(a, context))
      .filter(Boolean)
      .filter((a) => a.visible);

    return {
      type: "submenu",
      title,
      icon,
      items,
      visible: visible && items.length > 0,
    };
  }

  return {
    type: "button",
    title,
    icon,
    visible,
    onClick: () => action.perform && action.perform(context),
    selected: action.selected ? action.selected(context) : undefined,
  };
}

export function actionToKBar(
  action: Action,
  context: ActionContext
): CommandBarAction[] {
  if (typeof action.visible === "function" && !action.visible(context)) {
    return [];
  }

  const resolvedIcon = resolve<React.ReactElement<any>>(action.icon, context);
  const resolvedChildren = resolve<Action[]>(action.children, context);
  const resolvedSection = resolve<string>(action.section, context);
  const resolvedName = resolve<string>(action.name, context);
  const resolvedPlaceholder = resolve<string>(action.placeholder, context);
  const children = resolvedChildren
    ? flattenDeep(resolvedChildren.map((a) => actionToKBar(a, context))).filter(
        (a) => !!a
      )
    : [];

  return [
    {
      id: action.id,
      name: resolvedName,
      section: resolvedSection,
      placeholder: resolvedPlaceholder,
      keywords: action.keywords ?? "",
      shortcut: action.shortcut || [],
      icon: resolvedIcon,
      perform: action.perform ? () => action?.perform?.(context) : undefined,
    },
    // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
  ].concat(children.map((child) => ({ ...child, parent: action.id })));
}
