# Black Flag Token Bar

A draggable, high-contrast GM HUD designed specifically for the **Black Flag Roleplaying (Tales of the Valiant)** system on Foundry VTT.

![Version](https://img.shields.io/badge/Foundry-v13-orange)
![System](https://img.shields.io/badge/System-Black%20Flag-blue)

## 🛠 Features

* **Draggable HUD:** Keep the bar anywhere on your screen. Positions are saved per client.
* **Live Stat Tracking:** Monitor PC Armor Class (AC), Hit Points (HP), and Luck Points in real-time.
* **Smart Roll Requests:** * Initiate **Saving Throws**, **Ability Checks**, and **Skill Checks** for controlled tokens or all PCs.
    * **Automated Modifiers:** Deep-linked to the Black Flag data model to ensure proficiency, ability scores, and luck are correctly calculated.
    * **Hidden DCs:** Set a DC that players can't see, allowing for "Unknown" difficulty rolls while maintaining system automation.
* **Player Notifications:** Sends a subtle audio cue (dice sound) to players when a roll is requested to catch their attention.
* **One-Click Pan:** Click a character portrait to instantly pan the camera to that token on the canvas.
* **Utility Clearing:** Dedicated "Trash" button with a safety confirmation to wipe old roll requests from the chat log.

## 🚀 Installation

To install the module, go to the **Add-on Modules** tab in the Foundry VTT setup screen, click **Install Module**, and paste the following manifest URL:

`https://github.com/YOUR_USERNAME/black-flag-token-bar/releases/latest/download/module.json`

*(Replace YOUR_USERNAME with your actual GitHub username)*

## 📖 How to Use

1.  **Open the Bar:** The bar renders automatically for the GM upon login.
2.  **Request a Roll:** Click the **d20 icon** on the left. Choose the type of roll and set the DC.
3.  **Player Interaction:** Players receive a private chat card with a "Roll Now" button.
4.  **GM Oversight:** The GM can also click the "Roll Now" button in chat to assist players or perform tests.
5.  **Clean Up:** Use the **Trash icon** on the far right to delete all pending BFR requests from the chat log once a scene is over.

## ⚖️ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ❤️ Acknowledgements

* Built for the **Black Flag Roleplaying** system by Kobold Press.
* Special thanks to the Foundry VTT community for documentation on the V13 API transition.
