

// =======================================================================================
// inputs

const api_url = 'http://localhost:3000';
const epc_api_url = api_url + '/epc';

function clear_warnings(id) {
    let input_box_element = document.getElementById("input-box-" + id);
    let warn_elements = input_box_element.getElementsByClassName("warn");
    console.log(warn_elements)
    for (let warn_element of warn_elements) {
        warn_element.classList.add("hide");
    }
}

async function check_input(id, transform, conditions) {
    console.log('on_input', id);
    let input_element = document.getElementById("input-" + id);
    let help_element = document.getElementById("help-" + id);
    help_element.classList.add("hide");
    if (input_element.value == "") {
        input_element.classList.remove("valid", "invalid");
        clear_warnings(id);
    } else {
        if (transform != undefined) {
            input_element.value = transform(input_element.value);
        }
        let is_valid = true;
        for (let condition of conditions) {

            let warn_id = await condition(input_element.value);
            console.log('condition: ', condition, 'warn_id: ', warn_id);
            if (warn_id != "") {
                is_valid = false;
                clear_warnings(id);
                if (warn_id != "none") {
                    let warn_element = document.getElementById("warn-" + id + '-' + warn_id);
                    warn_element.classList.remove("hide");
                }
                break;
            }
        }

        if (is_valid) {
            input_element.classList.add("valid");
            input_element.classList.remove("invalid");
            clear_warnings(id);
        } else {
            input_element.classList.add("invalid");
            input_element.classList.remove("valid");
        }
    }
    check_submit();
}

function input_help(id) {
    let box_element = document.getElementById("input-box-" + id);
    let help_button = box_element.getElementsByClassName("input-side-button")[0];

    let help_element = document.getElementById("help-" + id);
    if (help_element.classList.contains("hide")) {
        help_element.classList.remove("hide");
        help_button.classList.add("active");
    } else {
        help_element.classList.add("hide");
        help_button.classList.remove("active");
    }
}

function hide_all(ids) {
    for (let id of ids) {
        document.getElementById(id).classList.add("hide");
    }
}

function unhide_all(ids) {
    for (let id of ids) {
        document.getElementById(id).classList.remove("hide");
    }
}

async function check_address() {
    function set_hide(unhide, hide) {
        for (let element of hide) {
            element.classList.add("hide");
        }
        for (let element of unhide) {
            element.classList.remove("hide");
        }
    }

    let address_element = document.getElementById("input-address");
    // let next_element = document.getElementById("address-next");
    let warn_element = document.getElementById("warn-address-not-listed");
    let epc_element = document.getElementById("input-box-epc-space-heating");
    let floor_element = document.getElementById("input-box-floor-area");


    let epc_input = document.getElementById("input-epc-space-heating");
    epc_input.value = "";

    check_input("epc-space-heating",
        undefined,
        [
            (value) => { if (value >= epc_space_heating_min && value <= epc_space_heating_max) { return ""; } else { return "range" } },
        ]
    );

    let floor_input = document.getElementById("input-floor-area");
    floor_input.value = "";

    check_input("floor-area",
        undefined,
        [
            (value) => { if (value >= floor_area_min && value <= floor_area_max) { return ""; } else { return "range" } },
        ]
    );

    clear_warnings("address");
    document.getElementById('help-address').classList.add("hide");
    console.log(address_element.value);
    switch (address_element.value) {
        case "select address":
            address_element.classList.remove("valid", "invalid");
            set_hide([], [warn_element, epc_element, floor_element]);
            break;
        case "address not listed":
            address_element.classList.remove("valid");
            address_element.classList.add("invalid");
            set_hide([epc_element, floor_element, warn_element], []);
            break;
        default:
            address_element.classList.add("valid");
            address_element.classList.remove("invalid");
            set_hide([], [warn_element, epc_element, floor_element]);
            let searching = document.getElementById("epc-searching");
            searching.classList.remove("hide");
            await get_epc_data();
            searching.classList.add("hide");
            set_hide([epc_element, floor_element], [warn_element]);

    }
}
let submit_status = false;
function check_submit() {
    let ids = ["postcode", "epc-space-heating", "floor-area", "temperature", "occupants", "tes-volume"]
    let submit = true;
    for (let id of ids) {
        let element = document.getElementById('input-' + id);
        if (!element.classList.contains("valid")) {
            submit = false;
        }
    }
    if (submit != submit_status) {
        submit_status = submit;
        let submit_element = document.getElementById('submit-group');
        let button = submit_element.getElementsByClassName("input-side-button")[0];
        if (submit) {
            submit_element.classList.remove("hide");
            if (button.classList.contains("active")) {
                unhide_all(['run-location']);
                set_run_location();
            }
        } else {
            submit_element.classList.add("hide");
            hide_all(['run-location', 'help-advanced', 'input-box-optimisation']);
        }
    }
}

function toggle_advanced_inputs() {
    let run_location = document.getElementById('run-location');
    let submit_element = document.getElementById('submit-group');
    let button = submit_element.getElementsByClassName("input-side-button")[0];
    if (run_location.classList.contains("hide")) {
        run_location.classList.remove("hide");
        button.classList.add("active");
        unhide_all(['run-location', 'help-advanced']);
        set_run_location();
    } else {
        button.classList.remove("active");
        hide_all(['run-location', 'help-advanced', 'input-box-optimisation']);
    }
}

function click_dismiss() {
    let elements = document.getElementsByClassName('click-dismiss');
    for (let element of elements) {
        element.addEventListener('click', () => { document.getElementById(element.id).classList.add('hide') });
    }
}

function set_run_location() {
    let element = document.getElementById("run-location");
    let opti_element = document.getElementById("input-box-optimisation");

    let index = element.selectedIndex;
    let value = element.getElementsByTagName("option")[index].value;
    console.log('run-location', value);
    switch (value) {
        case 'server-rust':
            opti_element.classList.add("hide");
            break;
        default:
            opti_element.classList.remove("hide");
    }
}

function toggle_optimisation() {
    let element = document.getElementById("input-optimisation");
    let box = document.getElementById("input-box-optimisation");
    let divs = element.getElementsByTagName('div');

    if (box.classList.contains("ticked")) {
        // element.classList.remove("ticked");
        box.classList.remove("ticked");
    } else {
        // element.classList.add("ticked");
        box.classList.add("ticked");
    }

    for (let div of divs) {
        if (div.classList.contains("checkmark")) {
            div.classList.add("crossmark");
            div.classList.remove("checkmark");
        } else {
            div.classList.remove("crossmark");
            div.classList.add("checkmark");
        }

    }
}

const input_ranges = { // MIN, MAX, MULTIPLIER
    'temperature': [0, 35, 10],
    'occupants': [1, 20, 1],
    'tes-volume': [0.1, 3.0, 10],
    'epc-space-heating': [0, 999999, 1],
    'floor-area': [25, 999, 1],
}


function get_check_input_fnc(id, apply_transform) {
    const MIN = 0; const MAX = 1; const MULTIPLIER = 2;
    switch (id) {

        default:
            const [min_input, max_input, multipler] = input_ranges[id];
            return () =>
                check_input(id,
                    apply_transform ? (value) => { return Math.round(Math.min(Math.max(value, min_input), max_input) * multipler) / multipler; } : undefined,
                    [
                        (value) => { if (value >= min_input && value <= max_input) { return ""; } else { return "range" } },
                    ]
                );
    }
}

const temperature_min = 0;
const temperature_max = 35;

const occupants_min = 1;
const occupants_max = 20;

const tes_min = 0.1;
const tes_max = 3.0;

const epc_space_heating_min = 0;
const epc_space_heating_max = 999999;

const floor_area_min = 25;
const floor_area_max = 999;

let longitude = undefined;
let latitude = undefined;
let scottish_postcode = false;
let epc_api_connection = true;

click_dismiss();

const input_id_list = ['temperature', 'occupants', 'tes-volume', 'epc-space-heating', 'floor-area'];

for (let input_id of input_id_list) {
    let element = document.getElementById('input-' + input_id);
    element.addEventListener('input', get_check_input_fnc(input_id, false));
    element.addEventListener('change', get_check_input_fnc(input_id, true));
}

// document.getElementById("input-temperature").addEventListener('input', () =>
//     check_input("temperature",
//         undefined,
//         [
//             (value) => { if (value >= temperature_min && value <= temperature_max) { return ""; } else { return "range" } },
//         ]));

// document.getElementById("input-temperature").addEventListener('change', () =>
//     check_input("temperature",
//         (value) => { return Math.round(Math.min(Math.max(value, temperature_min), temperature_max) * 10) / 10; },
//         [
//             (value) => { if (value >= temperature_min && value <= temperature_max) { return ""; } else { return "range" } },
//         ]
//     )
// );

// document.getElementById("input-occupants").addEventListener('input', () =>
//     check_input("occupants",
//         undefined,
//         [
//             (value) => { if (value >= occupants_min && value <= occupants_max) { return ""; } else { return "range" } },
//         ]));

// document.getElementById("input-occupants").addEventListener('change', () =>
//     check_input("occupants",
//         (value) => { return Math.round(Math.min(Math.max(value, occupants_min), occupants_max)); },
//         [
//             (value) => { if (value >= occupants_min && value <= occupants_max) { return ""; } else { return "range" } },
//         ]
//     )
// );

// document.getElementById("input-tes-volume").addEventListener('input', () =>
//     check_input("tes-volume",
//         undefined,
//         [
//             (value) => { if (value >= tes_min && value <= tes_max) { return ""; } else { return "range" } },
//         ]));

// document.getElementById("input-tes-volume").addEventListener('change', () =>
//     check_input("tes-volume",
//         (value) => { return Math.round(Math.min(Math.max(value, tes_min), tes_max) * 10) / 10; },
//         [
//             (value) => { if (value >= tes_min && value <= tes_max) { return ""; } else { return "range" } },
//         ]
//     )
// );

// document.getElementById("input-epc-space-heating").addEventListener('input', () =>
//     check_input("epc-space-heating",
//         undefined,
//         [
//             (value) => { if (value >= epc_space_heating_min && value <= epc_space_heating_max) { return ""; } else { return "range" } },
//         ]));

// document.getElementById("input-epc-space-heating").addEventListener('change', () =>
//     check_input("epc-space-heating",
//         (value) => { return Math.round(Math.min(Math.max(value, epc_space_heating_min), epc_space_heating_max)); },
//         [
//             (value) => { if (value >= epc_space_heating_min && value <= epc_space_heating_max) { return ""; } else { return "range" } },
//         ]
//     )
// );

// document.getElementById("input-floor-area").addEventListener('input', () =>
//     check_input("floor-area",
//         undefined,
//         [
//             (value) => { if (value >= floor_area_min && value <= floor_area_max) { return ""; } else { return "range" } },
//         ]));

// document.getElementById("input-floor-area").addEventListener('change', () =>
//     check_input("floor-area",
//         (value) => { return Math.round(Math.min(Math.max(value, floor_area_min), floor_area_max)); },
//         [
//             (value) => { if (value >= floor_area_min && value <= floor_area_max) { return ""; } else { return "range" } },
//         ]
//     )
// );


document.getElementById("input-postcode").addEventListener('input', async () => {
    let searching = document.getElementById("postcode-searching");
    searching.classList.remove("hide");
    await check_input("postcode",
        (postcode) => { return postcode.toUpperCase().replace(' ', ''); },
        [
            (_) => {
                hide_all(["input-address", "input-box-epc-space-heating", "input-box-floor-area"])
                let epc_element = document.getElementById("input-epc-space-heating");
                epc_element.value = "";
                check_input("epc-space-heating",
                    undefined,
                    [
                        (value) => { if (value >= epc_space_heating_min && value <= epc_space_heating_max) { return ""; } else { return "range" } },
                    ]
                );


                let floor_element = document.getElementById("input-floor-area");
                floor_element.value = "";
                check_input("floor-area",
                    undefined,
                    [
                        (value) => { if (value >= floor_area_min && value <= floor_area_max) { return ""; } else { return "range" } },
                    ]
                );
                return "";
            },
            (postcode) => {
                if (postcode.length > 4) {
                    let outcode_num = postcode.substr(-3, 1);
                    let outcode_str = postcode.substr(-2);
                    if (!isNaN(outcode_num) && /^[a-zA-Z]+$/.test(outcode_str)) {
                        return "";
                    }
                }
                return "none";
            },

            async (postcode) => {
                const postcode_url = 'https://api.postcodes.io/postcodes/' + postcode;

                try {
                    const response = await fetch(postcode_url);
                    const json = await response.json();
                    if (json['status'] == 200) {
                        console.log('postcode api data:', json);
                        if (json.result.latitude != null && json.result.longitude != null) {
                            if (json.result.country == "Scotland") {
                                scottish_postcode = true;
                            }
                            latitude = json.result.latitude;
                            latitude = json.result.longitude;
                            return "";
                        } else {
                            throw new Error('Postcode found on API, but does not have an associated latitude and longitude.');
                        }
                    } else {
                        throw new Error(data['error']);
                    }
                } catch (error) {
                    console.error('Postcode.io error: ', error);
                    if (error.message == "Failed to fetch") {
                        return "io-connection";
                    }
                    return "postcodes-io";
                }
            },

            async (postcode) => {
                if (!scottish_postcode) {
                    console.log("find address");
                    const full_url = `${epc_api_url}?postcode=${postcode}`;

                    try {
                        const response = await fetch(full_url);
                        const json = await response.json();
                        if (json['status'] == 200) {
                            console.log('addresses: ', json);
                            let element = document.getElementById('input-address');
                            //console.log(document.getElementsByTagName('option').length);
                            while (element.getElementsByTagName('option').length > 0) {
                                element.removeChild(element.lastChild);
                            }
                            element.classList.remove("valid", "invalid");
                            let opt1 = document.createElement('option');
                            opt1.text = "select address";
                            opt1.classList.add("color-neutral");
                            element.appendChild(opt1);
                            let opt2 = document.createElement('option');
                            opt2.text = "address not listed";
                            opt2.classList.add("color-warn");
                            element.appendChild(opt2);

                            for (const [address, certificate] of json.result) {
                                //console.log(address, certificate);
                                let option_ele = document.createElement('option');
                                option_ele.value = certificate;
                                option_ele.classList.add("color-neutral");

                                // capitalise each word
                                let address2 = address.toLowerCase().replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase());

                                option_ele.text = address2.substring(0, 45);
                                element.appendChild(option_ele);
                            }
                            element.classList.remove("hide");
                            return "";
                        } else {
                            throw new Error(json['error']);
                        }
                    } catch (error) {
                        console.error('EPC API Address error: ', error);
                        if (error.message == "Failed to fetch") {
                            epc_api_connection = false;
                            return "";
                        }
                        return "epc-api";
                    }
                }
                return "";
            },
            (postcode) => {
                if (scottish_postcode || !epc_api_connection) {
                    let epc_element = document.getElementById("input-box-epc-space-heating");
                    let floor_element = document.getElementById("input-box-floor-area");
                    epc_element.classList.remove("hide");
                    floor_element.classList.remove("hide");
                }
                return "";
            }
        ]
    );
    searching.classList.add("hide");
    if (!epc_api_connection) {
        document.getElementById("warn-postcode-epc-connection").classList.remove("hide");
    }
});

async function get_epc_data() {
    let select = document.getElementById('input-address');
    let certificate = select.options[select.selectedIndex].value;
    //console.log(certificate);
    // document.getElementById('input-box-epc-space-heating').classList.remove("hide");
    // document.getElementById('input-box-floor-area').classList.remove("hide");
    // document.getElementById('address-next').classList.add("hide");

    console.log("find address");
    const full_url = `${epc_api_url}?certificate=${certificate}`;

    try {
        const response = await fetch(full_url);
        const json = await response.json();
        if (json['status'] == 200) {
            console.log('addresses: ', json);
            const result = json['result'];

            let epc_element = document.getElementById('input-epc-space-heating');
            let floor_element = document.getElementById('input-floor-area');

            if (result['space-heating']) {
                const space_heating = result['space-heating'].match(/\d+/)[0];
                epc_element.value = space_heating;
                check_input("epc-space-heating",
                    undefined,
                    [
                        (value) => { if (value >= epc_space_heating_min && value <= epc_space_heating_max) { return ""; } else { return "range" } },
                    ]);
            } else {
                epc_element.value = undefined;
                document.getElementById('warn-epc-space-heating-none').classList.remove("hide");
            }
            if (result['floor-area']) {
                const floor_area = result['floor-area'].match(/\d+/)[0];
                floor_element.value = floor_area;
                check_input("floor-area",
                    undefined,
                    [
                        (value) => { if (value >= floor_area_min && value <= floor_area_max) { return ""; } else { return "range" } },
                    ]);
            } else {
                floor_element.value = undefined;
                document.getElementById('warn-floor-area-none').classList.remove("hide");
            }
            document.getElementById('help-address').classList.remove("hide");
        } else {
            throw new Error(json['error']);
        }
    }
    catch (error) {
        console.error('EPC API Certificate error: ', error);
        if (error.message == "Failed to fetch") {
            document.getElementById('warn-address-connection').classList.remove("hide");
        } else {
            document.getElementById('warn-address-unknown').classList.remove("hide");
        }
    }
}