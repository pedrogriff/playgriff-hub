# playgriff.me

This repo is the source of https://www.playgriff.me/, a set of live demos of my compensation and AI projects. Every demo runs on synthetic data, and the pay structures in them are invented.

## Demos

In the same order as the site navigation:

| Demo | On the site | Code |
| :--- | :--- | :--- |
| VestingSim | VestingSim tab on the [home page](https://www.playgriff.me/) | [vesting-sim-engine](https://github.com/pedrogriff/vesting-sim-engine) |
| Relata | [/relata/](https://www.playgriff.me/relata/) | [relata](https://github.com/pedrogriff/relata) |
| NextComp | [/nextcomp/](https://www.playgriff.me/nextcomp/) | [nextcomp](https://github.com/pedrogriff/nextcomp) |
| PeopleAgentMesh | [/people-agent-mesh/](https://www.playgriff.me/people-agent-mesh/) | [people-agent-mesh](https://github.com/pedrogriff/people-agent-mesh) |
| CompFlow | [/compflow/](https://www.playgriff.me/compflow/) | [comp-flow-platform](https://github.com/pedrogriff/comp-flow-platform) |
| Lab | Lab tab on the [home page](https://www.playgriff.me/) | games/ in this repo |
| AlgoCore | AlgoCore tab on the [home page](https://www.playgriff.me/) | [algocore-ds](https://github.com/pedrogriff/algocore-ds) |
| Homelab | Homelab tab on the [home page](https://www.playgriff.me/) | [homelab-k8s-talos](https://github.com/pedrogriff/homelab-k8s-talos) |

## Run it locally

    cd playgriff-hub
    python3 -m http.server 8080

Then open http://localhost:8080 in a browser.

## License

MIT License. See [LICENSE](LICENSE).
