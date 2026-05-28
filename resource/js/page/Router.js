import { Dynamic } from "../init/module.js";
import { IconX } from "../component/XBox.js";
import Memo from "./Note/Memo.js";
import Link from "./Note/Link.js";

const MainRouter = [
    IconX({ icon: "player", onclick: async () => Dynamic.FragMutation.mutate((await import("./Player.js")).default) }),
    IconX({ icon: "link", onclick: () => Dynamic.FragMutation.mutate(Link) }),
    IconX({ icon: "memo", onclick: () => Dynamic.FragMutation.mutate(Memo) })
]

export { MainRouter  };
