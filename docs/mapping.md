# Mapping

Mapping is the core module of the app that allows you to create custom maps. The key elements of mapping are **Map Groups** and **Map Points**. **Map Groups** define identifiers, styling, and property definitions for **Map Points**. Every **Map Point** must belong to a **Map Group**. A **Session** represents a saved map state, which you can reopen later or export for further analysis.

## Map Groups

Click the **Map Groups** button on the main actions panel to open the **Map Groups** manager. Here, you can create new groups, view or edit existing ones, check their status, or delete selected groups entirely. The list of **Map Groups** also shows how many **Map Points** are associated with each group, and clicking a group entry will display its associated **Map Points**.

When creating a new group, you will be asked to provide a name, icon, and color. These attributes help identify **Map Points** belonging to that group on the map. In addition, you can define a set of properties for the group, which can then be filled in for each associated **Map Point**.

**Note:** Once **Map Group** is created, you cannot delete existing properties - only add new ones.

## Map Points

**Map Points** can be managed directly from the map or from the list of **Map Points** accessible through the **Map Groups** manager.

To manage an existing **Map Point**, open its information prompt and use the available actions in the menu located in the header section. You can access this prompt by clicking the **Map Point** on the map or by clicking the information button in the **Map Points** list within the **Map Groups** manager.

To create **Map Point**, right‑click the exact location on the map where you want to place it and select **Add Point**. When **Map Point** is being created, its coordinates cannot be changed - they are taken from the location you clicked. You can edit its coordinates later.

## Geometry

In addition to **Map Points**, you can add **Geometry** and **Measurements** using the secondary actions panel next to the main actions panel.

Clicking on existing **Geometry** or **Measurements** will open a prompt allowing you to delete them.

## Navigation

There are several ways to navigate within the map:

* **Navigate Me** button on the main actions panel - centers the map on your current location  
* **Go To Coordinates** on the main actions panel - lets you enter coordinates to navigate to  
* **Center On Coordinates** in the right‑click menu - centers the map on the selected location  
* Clicking an entry in the **Map Points** list - centers the map on the selected **Map Point**  

For manual dragging, hold the `Ctrl` key and drag the map with the left mouse button. Alternatively, you can enable dragging without `Ctrl` by clicking **Free Dragging** on the main actions panel.

You can also enable **Graticule** mode by clicking the **Graticule** button on the main actions panel. This adds a layer showing parallels of latitude and meridians of longitude.

## Session Status

An indicator in the bottom‑left corner shows the current status of your **Session** and whether it is saved in the database. There are three primary statuses:

* The **Session** has not been saved  
* The **Session** has been saved, but local changes have been made - in this case, a button will appear allowing you to discard local changes and sync with the saved version  
* The **Session** has been saved, and local changes match the stored data

## Public Access

If you run the app as a web application available on the internet, you can create a public session to share. Non‑logged‑in users will then be able to access and view the data you choose to make public. To enable this, you must specify the public session in your configuration file.  

The required session identifier can be taken from the exported session file, which you can download from the **Session Manager** available in the main actions panel. See [Getting Started](getting-started.md) for more details on how to configure it.
