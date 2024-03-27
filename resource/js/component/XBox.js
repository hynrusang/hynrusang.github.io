const InputX = ({label, placeholder, type="text"}) => $("div", {class: "inputBox"}).add(
    $("label", {text: label.charAt(0).toUpperCase() + label.slice(1)}),
    $("input", {required: "", type: type, placeholder: placeholder})
)

export { InputX }