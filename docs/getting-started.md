# Getting Started

To begin working with **Boiled - Cartography Notepad**, download the bundled app for your supported operating system from **[GitHub](https://github.com/misemaxim/boiled-public/releases)**. The downloaded package includes everything required to run the app, including the bundled version of Node.js.

It is recommended that your client system meets the following requirements for a smooth experience:

* Modern CPU  
* Chromium‑based web browser  
* 8 GB of RAM
* 1920x1080 Display Resolution

## SuperUser

Before running the app, you must configure the **super user**, which is used to access the app with administrative permissions-such as managing data, configuring the app experience, and more. To do this, specify the **username** for the **super user** in the provided `config.toml` file:

```
superUser="boiled"
```

You may choose any **username**, but it must contain only English letters and digits.  
On the first run, you will be asked to log in using the configured **super user** and the default password: **password**.

It is strongly recommended that you change this default password immediately after logging in. To change it, open the **USER** section from the main navigation and use the menu in the header of the prompt to access the password change option.

**Important:** The app will not run unless the **super user** is configured correctly.

## Running the Software

To run the app, use the appropriate `run.xx(x)` script included in the downloaded package. By default, the app starts at [http://localhost:9000](http://localhost:9000).

You can change the port by setting the `server.port` property in `config.toml`:

```
[server]
port=9001
```

### Linux

Open a terminal in the package directory and run:

```
./run.sh
```

### Windows

Open PowerShell in the package directory and run:

```
.\run.cmd
```

## Configuration File

In addition to the settings mentioned above, `config.toml` supports more advanced configuration options that control how the app runs. The properties include:

| Configuration Property       | Definition |
|------------------------------|------------|
| `superUser`                  | The system superuser with administrative access |
| `app.layers.enableDefault`   | Enables the default set of map layers |
| `app.layers.enableSatellite` | Enables the default satellite map layers |
| `app.layers.customLayers`    | A set of custom map layers defined within the app |
| `app.public.enabled`         | Enables public access for non‑logged‑in users |
| `app.public.sessionId`       | The session identifier exposed publicly (required when public access is enabled) |
| `app.public.message`         | A message or disclaimer shown to non‑logged‑in users accessing the public session |
| `app.public.layers`          | The set of map layers available in the public session |
| `app.public.metric`          | A flag that defines the use of the metric system when the application is running in public mode |
| `server.port`                | The port on which the app runs locally |

The `app.layers.customLayers` and `app.public.layers` properties require specific configuration for each layer:

| Layer Property | Definition |
|----------------|------------|
| `name`         | The name displayed in the UI for the layer |
| `url`          | The URL of the XYZ map tile layer |
| `attribution`  | The attribution required for legal use of the layer |

For each configured layer in `app.layers.customLayers` and `app.public.layers`, the software will attempt to verify availability. If the check fails, the layer will not be available and an error message will be shown.

Configuration must follow TOML syntax in your `config.toml` file. Below is an example:

```
superUser="boiled"

[app.layers]
enableDefault=true
enableSatellite=true
customLayers=[
  { name="Layer A", url="https://layers-for-boiled.com/tile/{z}/{y}/{x}", attribution="Copyright 1" },
  { name="Layer B", url="https://layers-for-boiled.com/tile/{z}/{y}/{x}", attribution="Copyright 2" }
]

[app.public]
enabled=true
sessionId="DzfPJsqWCOmmyT04"
message="This Is Public"
layers=[
  { name="Layer A", url="https://layers-for-boiled.com/tile/{z}/{y}/{x}", attribution="Copyright 1" },
  { name="Layer B", url="https://layers-for-boiled.com/tile/{z}/{y}/{x}", attribution="Copyright 2" }
]
metric=true

[server]
port=9000
```
