<div align="center">

<img src="imgs/icon-256.png" alt="My Prayer logo" width="96">

# My Prayer

**Your personal prayer companion, right in your browser.**

Prayer times for your location, morning & evening adhkar, and reminders for the prayers you choose.

[![Get it on Microsoft Edge](https://img.shields.io/badge/Get_it_on-Microsoft_Edge-0078D7?logo=microsoftedge&logoColor=white)](https://microsoftedge.microsoft.com/addons/detail/my-prayer/kfifklbdcpifbkeebmieolhfnkkepbgk?hl=en-US)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

<img src="https://github.com/user-attachments/assets/f61cfb5e-5ed8-47ea-a2d3-0997075c8634" alt="My Prayer popup showing the next prayer, the time remaining and today's Hijri date" width="820">

</div>

## Features

- **Next prayer at a glance:** the popup shows the previous and next prayer, a countdown, a progress bar and today's Hijri date.
- **Full prayer times in a side panel:** see every prayer of the day, with the upcoming one highlighted.
- **Morning & evening adhkar:** a counter for each zekr, a reset button, and the virtue (fadl) of each one.
- **Reminders you control:** turn notifications on, then choose exactly which prayers should notify you.
- **Your location:** detected automatically, or set it by searching for your city. The calculation method is picked for your location.
- **Light, dark or system theme:** applied to every page at once.
- **Free and open source** under the MIT license.

## Screenshots

<table>
  <tr>
    <td width="50%"><img src="https://github.com/user-attachments/assets/98641390-a07c-4ec6-b8bb-104f3d7a81f0" alt="Light and dark themes"></td>
    <td width="50%"><img src="https://github.com/user-attachments/assets/22a5f48b-8bde-4ee1-b4dd-89f8293b49fe" alt="Choose which prayers send a reminder"></td>
  </tr>
  <tr>
    <td width="50%"><img src="https://github.com/user-attachments/assets/f4a32093-6827-44b5-90ef-d38a2b233934" alt="Prayer times and adhkar in the side panel"></td>
    <td width="50%"><img src="https://github.com/user-attachments/assets/a238a113-c323-4228-a11c-f1d76638d7a3" alt="Search for your city"></td>
  </tr>
</table>

## Install

**Microsoft Edge:** get it from the [Edge Add-ons store](https://microsoftedge.microsoft.com/addons/detail/my-prayer/kfifklbdcpifbkeebmieolhfnkkepbgk?hl=en-US).

**Chrome and other Chromium browsers (manual install):**

1. [Download the ZIP](https://github.com/mahmouddwidar/My-Prayer/archive/refs/heads/main.zip) and unzip it, or clone the repo.
2. Open the extensions page (`chrome://extensions`, or `edge://extensions` in Edge).
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the folder that contains `manifest.json`.

There is no build step.

## Privacy

- Your settings are stored locally in your browser.
- When you search for a city, the text you type is sent to [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org/) to find matching places.
- Prayer times are fetched for your saved coordinates.

## Roadmap

- [ ] Adhan to Iqamah timer
- [ ] Midnight time
- [ ] Choose the calculation method manually
- [ ] More color themes

Have an idea? [Open an issue](https://github.com/mahmouddwidar/My-Prayer/issues).

## Contributing

Contributions are welcome: report bugs, suggest features, or send a pull request.

- The extension is plain JavaScript, HTML and CSS. To try your changes, load the folder as an unpacked extension (see above) and reload it after each edit.
- All colors live in `utils/theme.css` as CSS variables, and the theme is applied by `utils/theme.js` through the `data-theme` attribute on `<html>`. Use the existing variables instead of hardcoding colors.
- Design guidelines and UI components are in the [Figma file](https://www.figma.com/design/bgkUGMAzLRUbiL1w3A9s3f/My-Prayer-Extension?node-id=0-1&m=dev&t=h11LdWPBNSoe6juB-1). Please keep new screens consistent with it.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## License

Released under the [MIT License](LICENSE).
