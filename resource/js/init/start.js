import { Dynamic } from "./module.js";
import DataResource from "../util/DataResource.js";
import Login from "../page/Prepare/Login.js"

DataResource.init();
Dynamic.FragMutation.mutate(Login);