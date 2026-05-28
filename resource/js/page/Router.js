import { Dynamic } from "../init/module.js";
import { IconX } from "../component/XBox.js";
import Navigation from "./Setting/Navigation.js";

const MainRouter = [
    IconX({ icon: "navigator", onclick: () => Dynamic.FragMutation.mutate(Navigation) })
]

export { MainRouter };
