# Plugins API

This section describes the interfaces and data structures related to writing and invoking **Plugins**.

## Common Parameters

Each **Plugin** receives a `scope` parameter containing the data relevant to the **Plugin** invocation, depending on its type. All **Plugins** share the following common `scope` parameters:

```
const { session, context, axios, notification, overlay } = scope;
```

| Scope Parameter      | Definition |
|----------------------|------------|
| `scope.session`      | The current Session associated with the map |
| `scope.context`      | The context of the map associated with the current Session |
| `scope.axios`        | An instance of [Axios](https://axios.rest/), an HTTP client for the browser |
| `scope.notification` | A function used to trigger notifications in the map interface |
| `scope.overlay`      | A function used to trigger modal prompts in the map interface |

## Session Scope API

A `scope.session` parameter contains information about the underlying **Session** that is visualized on the map.

```
interface Session {
  groups: MapGroup[];
  points: Record<string, MapPoint[]>;
  geometry: string;
  measurements: string;
  arrows: string;
  name: string;
  plugins: string[];
}

interface MapGroup {
  id: string;
  created: number;
  icon: string;
  name: string;
  color: string;
  properties: string[];
  plugins: string[];
}

interface MapPoint {
  id: string;
  created: number;
  coordinates: [lon: number, lat: number];
  name: string;
  group: string;
  properties: string[];
}
```

### Session Parameters

| Session Parameter      | Definition |
|------------------------|------------|
| `session.name`         | The name of the session |
| `session.groups`       | The list of **Map Groups** in the session |
| `session.points`       | The **Map Points** grouped by **Map Group** identifier |
| `session.geometry`     | A GeoJSON string representing the map geometry |
| `session.measurements` | A GeoJSON string representing the map measurements |
| `session.arrows`       | A GeoJSON string representing the map arrows |
| `session.plugins`      | The list of **Plugin** identifiers added to the session |

### Map Group Parameters

| Map Group Parameter | Definition |
|---------------------|------------|
| `group.id`          | The **Map Group** identifier |
| `group.created`     | The timestamp when the **Map Group** was created |
| `group.icon`        | The icon associated with the **Map Group** |
| `group.name`        | The **Map Group** name |
| `group.color`       | The **Map Group** color |
| `group.properties`  | The list of properties for **Map Points** in the **Map Group** |
| `group.plugins`     | The list of **Plugin** identifiers added to **Map Points** in the **Map Group** |

### Map Point Parameters

| Map Point Parameter | Definition |
|---------------------|------------|
| `point.id`          | The **Map Point** identifier |
| `point.created`     | The timestamp when the **Map Point** was created |
| `point.coordinates` | The coordinates of the **Map Point** |
| `point.name`        | The **Map Point** name |
| `point.group`       | The identifier of the **Map Group** the **Map Point** belongs to |
| `point.properties`  | The list of property values for the **Map Point** |

---

## Context Scope API

A `scope.context` parameter exposes basic actions for working with the map created from the underlying **Session**. In addition, it provides an initialized [OpenLayers](https://openlayers.org/) map instance, giving advanced users full control over the map.

```
interface Context {
  initializing: Promise,
  methods: {
    goToCoordinates: (coordinates: [lon: number, lat: number], zoom: number) => void,
    goToCurrentCoordinates: () => void,
    zoomIn: () => void,
    zoomOut: () => void
  },
  groups: {
    add: (group: Omit<MapGroup, 'id' | 'created'>) => void,
    update: (group: MapGroup) => void,
    delete: (id: string) => void
  },
  points: {
    add: (point: Omit<PointData, 'id' | 'created'>) => void,
    update: (point: PointData) => void,
    delete: (id: [groupId: string, pointId: string]) => void
  },
  map: Map
}
```

| Context Parameter                        | Definition |
|------------------------------------------|------------|
| `context.initializing`                   | Indicates whether the map is fully initialized according to the session |
| `context.methods.goToCoordinates`        | Moves the map center to the given coordinates |
| `context.methods.goToCurrentCoordinates` | Moves the map center to the user's detected coordinates |
| `context.methods.zoomIn`                 | Zooms the map in |
| `context.methods.zoomOut`                | Zooms the map out |
| `context.groups.add`                     | Adds a new **Map Group** to the session |
| `context.groups.update`                  | Updates an existing **Map Group** |
| `context.groups.delete`                  | Deletes an existing **Map Group** |
| `context.points.add`                     | Adds a new **Map Point** to the session |
| `context.points.update`                  | Updates an existing **Map Point** |
| `context.points.delete`                  | Deletes an existing **Map Point** |
| `context.map`                            | The initialized [OpenLayers](https://openlayers.org/) Map instance |

## Axios Scope API

An instance of [Axios](https://axios.rest/), an HTTP client for the browser.

## Notification Scope API

A function used to trigger notifications in the map interface.

```
type Notification = (message: string | JSX.Element, type: 'normal' | 'error') => void;
```

| Notification Parameter | Definition |
|------------------------|------------|
| `message`              | The content of the displayed notification |
| `type`                 | The type of notification (`normal` or `error`) |

## Overlay Scope API

A function used to trigger modal prompts in the map interface. It can either display information only or include an additional confirmation action by specifying the required confirmation details.

```
interface OverlayParams {
  message: string,
  confirmAction: () => void,
  confirmText: string
}

type Overlay = ({ message, confirmAction, confirmText }: OverlayParams) => void
```

| Overlay Parameter | Definition |
|-------------------|------------|
| `message`         | The content of the displayed overlay |
| `confirmAction`   | The callback invoked when the overlay is confirmed |
| `confirmText`     | The text displayed on the confirmation button |

## Type-specific Parameters

### Coordinates Plugin Scope API

Additional `scope` properties:

| Scope Parameter     | Definition |
|---------------------|------------|
| `scope.coordinates` | The coordinates at which the **Plugin** is invoked, in the format `[lon: number, lat: number]` |

### Search Plugin Scope API

Additional `scope` properties:

| Scope Parameter | Definition |
|-----------------|------------|
| `scope.query`   | The search string provided by the user |

### Point Plugin Scope API

Additional `scope` properties:

| Scope Parameter | Definition |
|-----------------|------------|
| `scope.point`   | The **Map Point** details from which the **Plugin** is invoked |
| `scope.group`   | The **Map Group** associated with the **Map Point** |

### Refresh Plugin Scope API

No additional API is provided.
