# Plugins

To gain more flexibility when working with the map and to extend its functionality, you can create and use **Plugins**. Depending on the **Plugin** type, you can define actions and conditions to manipulate your data or provide additional information. The following **Plugin** types are available, each with its own dedicated scope:

| Plugin Type   | Definition |
|---------------|------------|
| `coordinates` | Runs from the coordinates of the right‑click menu on the map |
| `search`      | Runs from the query string you provide |
| `point`       | Runs from a specific **Map Point** |
| `refresh`     | Runs from the entire map during a map refresh |

To start writing a **Plugin** or edit existing ones, open the **PLUGINS** section from the main navigation. This will open the editor where you can work with **Plugins**.

The secondary actions panel, located next to the main actions panel, allows you to change the type of the currently open plugin and test it within the test scope.

## Coordinates Plugin

To view available **Coordinates Plugins**, right‑click on the map in the **MAPPING** interface. If any **Plugins** of this type are available, a **Coordinates Plugins** option will appear, allowing you to select and run a **Plugin**.

To add this **Plugin** type to your **Session**, go to **MAPPING**, click the **Plugins** button in the secondary actions panel, and make the appropriate selection.

## Search Plugin

To view available **Search plugins**, look for the **Search** button on the main actions panel of the **MAPPING** interface. It becomes active when **Search Plugins** are added to the **Session**. Clicking the **Search** button opens a selector where you can run a **Plugin**.

To add this plugin type to your **Session**, go to **MAPPING**, click the **Plugins** button in the secondary actions panel, and make the appropriate selection.

## Point Plugin

If a **Map Point** has any **Plugins** added to it, they will appear in the menu located in the header section of the **Map Point** information prompt. **Plugins** added through a **Map Group** in the **Map Groups** manager will automatically be available for every **Map Point** in that **Map Group**.

To add such plugins, click the **Map Groups** button on the main actions panel of the **MAPPING** interface, then click the **Plugins** button next to the **Map Group** containing the desired **Map Points**.

## Refresh Plugin

**Refresh Plugins** run across the entire map within the **MAPPING** interface. The **Refresh** and **Auto‑Refresh** buttons in the main actions panel trigger a map refresh, which also executes any added **Refresh Plugins**.

To add this plugin type to your Session, go to **MAPPING**, click the **Plugins** button in the secondary actions panel, and make the appropriate selection.
