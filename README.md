# Karabiner Elements CLI Helper

A simple CLI tool built with [Bun](https://bun.sh/) to make managing [Karabiner Elements](https://karabiner-elements.pqrs.org/) complex modifications a bit easier, especially when juggling multiple macro pads and foot pedals!

This tool was created to simplify:
- Listing existing complex modifications.
- Adding new complex modifications with device presets and auto-suggested "to" key mappings.
- Monitoring the Karabiner configuration file for live updates.

## Features

- **`list`**: Displays all active complex modifications from your Karabiner setup.
- **`add`**: Interactively guides you through adding a new complex modification.
    - Select from predefined device presets or define a custom device.
    - Input your desired "from" key.
    - Get an auto-suggested, available "to" key + Hyper modifier combination.
    - Auto-generates a rule description.
- **`watch`**: Monitors your `karabiner.json` file for changes and re-lists the modifications in real-time.

## Why?

I have too many macro pads and foot pedals, and managing their Karabiner complex modifications directly in the JSON file or via the Karabiner Elements UI became cumbersome. This tool streamlines the process, especially for adding new Hyper key mappings quickly.

Enjoy!

## Prerequisites

- [Bun](https://bun.sh/docs/installation) installed on your system.
- [Karabiner Elements](https://karabiner-elements.pqrs.org/docs/manual/operation/installation/) installed and configured.

## Setup & Usage

1.  **Clone the repository (or download the files).**
2.  **Navigate to the project directory:**
    ```bash
    cd karabiner-cli
    ```
3.  **Install dependencies:**
    ```bash
    bun install
    ```
4.  **(Important) Configuration Path:**
    This script defaults to using the Karabiner configuration file at `/Users/oliy/.config/karabiner/karabiner.json`. If your configuration file is located elsewhere, you'll need to **manually edit the `KARABINER_CONFIG_PATH` constant** at the top of the `karabiner-cli/configManager.ts` file to point to your correct `karabiner.json` path.

    You'll also need to update the path in the `watch` command in `karabiner-cli/index.ts` if you change it.

5.  **Run commands:**
    ```bash
    bun run index.ts list
    bun run index.ts add
    bun run index.ts watch
    bun run index.ts --help # To see all commands
    ```


