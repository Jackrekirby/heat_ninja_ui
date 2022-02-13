// ---- SIMULATION INPUTS
// -- this section includes the code for the functionality of the simulation inputs


// ---- TERMS
// id = javascript id, as per document.getElementById(id).
// pid = partial id, corresponding to the name of the input lists


// ---- FUNCTIONS GUIDE
// clear_warnings(pid)
// -- clear all warning related to an input pid
// async function check_input(pid, transform, conditions)
// -- input validation
// input_help(pid)
// -- toggle help/info for input pid
// hide_ids(ids), hide_pids(pids), hide_elements(elements)
// -- hide all ids/pids/elements in the list
// unhide_ids(ids), unhide_pids(pids), unhide_elements(elements)
// -- unhide all ids/pids/elements in the list
// clear_value(pid), set_value(pid, value)
// -- clear/set the value of a pid
// validate_element(element), invalidate_element(element), clear_element_validation(element)
// -- add and remove valid and invalid class to element
// async onchange_address()
// -- update warning, epc_calling ... upon selection address change
// check_submit()
// -- check if all inputs are valid so simulation can be submitted
// toggle_advanced_inputs()
// -- toggle advanced inputs but dont reset them
// click_dismiss()
// -- any element with click-dismiss class automatically has click event applied with pointer styling
// set_run_location()
// -- set where simulation will run, client or server-side
// toggle_optimisation()
// -- toggle the checkbox for optimisation
// async get_epc_data()
// -- call the EPC API to get the epc_space_heating and floor_area for a given EPC certificate
// get_check_input_fnc(pid, apply_transform)
// -- returns a function that builds the check_input function, with option of including the transform function
// hide_postcode_related_inputs()
// -- if postcode is not valid then hide address, floor area and epc space heating inputs
// check_postcode_format(postcode)
// -- only call postcodes.io if outcode is of valid format
// async validate_postcode(postcode)
// -- call postcodes.io to get longitude and latitude data for postcode
// async get_address_certificates(postcode)
// -- get a list of addresses and their respective certificate codes for postcode
// show_manual_epc_input()
// -- if postcode is located in scotland or api request failed then fallback to manual floor area and space heating input


// ---- GLOBALS
const api_url = 'http://localhost:3000';
const epc_api_url = api_url + '/epc';
let submit_status = false;

const input_ranges = { // MIN, MAX, MULTIPLIER
    'temperature': [0, 35, 10],
    'occupants': [1, 20, 1],
    'tes-volume': [0.1, 3.0, 10],
    'epc-space-heating': [0, 999999, 1],
    'floor-area': [25, 999, 1],
}

let longitude = undefined;
let latitude = undefined;
let scottish_postcode = false;
let epc_api_connection = true;
let epc_api_error = false;
const input_id_list = ['postcode', 'epc-space-heating', 'floor-area', 'temperature', 'occupants', 'tes-volume'];


// ---- INITIALISATION
// apply validation functions to oninput and onchange events for each input (excluding selections and checkboxes)
for (let input_id of input_id_list) {
    let element = document.getElementById('input-' + input_id);
    if (input_id != 'postcode') {
        element.addEventListener('change', get_check_input_fnc(input_id, true));
    }
    element.addEventListener('input', get_check_input_fnc(input_id, false));
}

// apply onclick events to all elements with the click-dismiss class
click_dismiss();


// ---- FUNCTIONS

function clear_warnings(pid) {
    let input_box_element = document.getElementById("input-box-" + pid);
    let warn_elements = input_box_element.getElementsByClassName("warn");
    for (let warn_element of warn_elements) {
        warn_element.classList.add("hide");
    }
}

async function check_input(pid, transform, conditions) {
    let input_element = document.getElementById("input-" + pid);
    let help_element = document.getElementById("help-" + pid);

    help_element.classList.add("hide");
    if (input_element.value == "") {
        input_element.classList.remove("valid", "invalid");
        clear_warnings(pid);
    } else {
        if (transform != undefined) {
            input_element.value = transform(input_element.value);
        }

        let is_valid = true;
        for (let condition of conditions) {
            let warn_pid = await condition(input_element.value);
            if (warn_pid != "") {
                is_valid = false;
                clear_warnings(pid);
                if (warn_pid != "none") {
                    console.log("pid: ", pid, ", warn_pid: ", warn_pid, "condition", condition);
                    let warn_element = document.getElementById("warn-" + pid + '-' + warn_pid);
                    warn_element.classList.remove("hide");
                }
                break;
            }
        }

        if (is_valid) {
            input_element.classList.add("valid");
            input_element.classList.remove("invalid");
            clear_warnings(pid);
        } else {
            input_element.classList.add("invalid");
            input_element.classList.remove("valid");
        }
    }
    check_submit();
}

function input_help(pid) {
    let help_button = document.getElementById("input-box-" + pid).getElementsByClassName("input-side-button")[0];

    let help_msg = document.getElementById("help-" + pid);
    if (help_msg.classList.contains("hide")) {
        help_msg.classList.remove("hide");
        help_button.classList.add("active");
    } else {
        help_msg.classList.add("hide");
        help_button.classList.remove("active");
    }
}

function hide_ids(ids) {
    for (let id of ids) {
        document.getElementById(id).classList.add("hide");
    }
}

function unhide_ids(ids) {
    for (let id of ids) {
        document.getElementById(id).classList.remove("hide");
    }
}

function hide_pids(pids) {
    for (let pid of pids) {
        document.getElementById('input-' + pid).classList.add("hide");
    }
}

function unhide_pids(pids) {
    for (let pid of pids) {
        document.getElementById('input-' + pid).classList.remove("hide");
    }
}

function hide_elements(elements) {
    for (let element of elements) {
        element.classList.add("hide");
    }
}

function unhide_elements(elements) {
    for (let element of elements) {
        element.classList.remove("hide");
    }
}

function clear_value(pid) {
    document.getElementById('input-' + pid).value = "";
}

function set_value(pid, value) {
    document.getElementById('input-' + pid).value = value;
}

function validate_element(element) {
    element.classList.add("valid");
    element.classList.remove("invalid");
}

function invalidate_element(element) {
    element.classList.remove("valid");
    element.classList.add("invalid");
}

function clear_element_validation(element) {
    element.classList.remove("valid", "invalid");
}

async function onchange_address() {
    let address_element = document.getElementById("input-address");
    let warn_element = document.getElementById("warn-address-not-listed");
    let epc_box_element = document.getElementById("input-box-epc-space-heating");
    let floor_area_box_element = document.getElementById("input-box-floor-area");
    let searching = document.getElementById("epc-searching");

    let epc_input = document.getElementById("input-epc-space-heating");
    epc_input.value = "";

    clear_value('epc-space-heating');
    get_check_input_fnc('epc-space-heating', false)();
    clear_value('floor-area');
    get_check_input_fnc('floor-area', false)();
    clear_warnings("address");
    hide_ids(['help-address']);

    switch (address_element.value) {
        case "Select Address":
            clear_element_validation(address_element);
            hide_elements([warn_element, epc_box_element, floor_area_box_element]);
            break;
        case "Address Not Listed":
            invalidate_element(address_element);
            unhide_elements([warn_element, epc_box_element, floor_area_box_element]);
            break;
        default:
            validate_element(address_element);
            hide_elements([warn_element, epc_box_element, floor_area_box_element]);
            unhide_elements([searching]);
            await get_epc_data();
            unhide_elements([epc_box_element, floor_area_box_element]);
            hide_elements([searching, warn_element]);
    }
}

function check_submit() {
    let submit = true;
    for (let pid of input_id_list) {
        let element = document.getElementById('input-' + pid);
        if (!element.classList.contains("valid")) {
            submit = false;
        }
    }
    if (submit != submit_status) {
        submit_status = submit;
        let submit_element = document.getElementById('submit-group');
        let advanced_element = submit_element.getElementsByClassName("input-side-button")[0];
        if (submit) {
            unhide_elements([submit_element]);
            if (advanced_element.classList.contains("active")) {
                unhide_ids(['run-location']);
                set_run_location();
            }
        } else {
            hide_elements([submit_element]);
            hide_ids(['run-location', 'help-advanced', 'input-box-optimisation']);
        }
    }
}

function toggle_advanced_inputs() {
    let run_location = document.getElementById('run-location');
    let submit_element = document.getElementById('submit-group');
    let button = submit_element.getElementsByClassName("input-side-button")[0];
    if (run_location.classList.contains("hide")) {
        unhide_elements([run_location]);
        button.classList.add("active");
        unhide_ids(['run-location', 'help-advanced']);
        set_run_location();
    } else {
        button.classList.remove("active");
        hide_ids(['run-location', 'help-advanced', 'input-box-optimisation']);
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
    let optimisation_element = document.getElementById("input-box-optimisation");
    let value = element.getElementsByTagName("option")[element.selectedIndex].value;
    switch (value) {
        case 'server-rust':
            hide_elements([optimisation_element]);
            break;
        default:
            unhide_elements([optimisation_element]);
    }
}

function toggle_optimisation() {
    let element = document.getElementById("input-optimisation");
    let box = document.getElementById("input-box-optimisation");
    let divs = element.getElementsByTagName('div');

    if (box.classList.contains("ticked")) {
        box.classList.remove("ticked");
    } else {
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

async function get_epc_data() {
    let select = document.getElementById('input-address');
    let certificate = select.options[select.selectedIndex].value;
    const full_url = `${epc_api_url}?certificate=${certificate}`;

    try {
        const response = await fetch(full_url);
        const json = await response.json();
        if (json['status'] == 200) {
            console.log('epc-certificate-json: ', json);
            const result = json['result'];

            if (result['space-heating']) {
                set_value('epc-space-heating', result['space-heating'].match(/\d+/)[0]);
                get_check_input_fnc('epc-space-heating', false)();
            } else {
                clear_value('epc-space-heating');
                unhide_ids(['warn-epc-space-heating-none']);
            }

            if (result['floor-area']) {
                set_value('floor-area', result['floor-area'].match(/\d+/)[0]);
                get_check_input_fnc('floor-area', false)();
            } else {
                clear_value('floor-area');
                unhide_ids(['warn-floor-area-none']);
            }

            unhide_ids(['help-address']);
        } else {
            throw new Error(json['error']);
        }
    }
    catch (error) {
        console.error('epc-certificate-json-error: ', error);
        if (error.message == "Failed to fetch") {
            unhide_elements(['warn-address-connection']);
        } else {
            unhide_elements(['warn-address-unknown']);
        }
    }
}

function get_check_input_fnc(pid, apply_transform) {
    switch (pid) {
        case 'postcode':
            return async () => {
                let searching = document.getElementById("postcode-searching");
                unhide_elements([searching]);
                await check_input("postcode",
                    (postcode) => { return postcode.toUpperCase().replace(' ', ''); },
                    [
                        hide_postcode_related_inputs,
                        (postcode) => { return check_postcode_format(postcode); },
                        async (postcode) => { return validate_postcode(postcode); },
                        async (postcode) => { return get_address_certificates(postcode); },
                        show_manual_epc_input,
                    ]
                );
                hide_elements([searching]);
                if (!epc_api_connection) {
                    unhide_ids(['warn-postcode-epc-connection']);
                } else if (epc_api_error) {
                    unhide_ids(['warn-postcode-epc-api']);
                }
            };
            break;
        default:
            const [min_input, max_input, multipler] = input_ranges[pid];
            return () =>
                check_input(pid,
                    apply_transform ? (value) => { return Math.round(Math.min(Math.max(value, min_input), max_input) * multipler) / multipler; } : undefined,
                    [
                        (value) => { if (value >= min_input && value <= max_input) { return ""; } else { return "range" } },
                    ]
                );
    }
}

function hide_postcode_related_inputs() {
    scottish_postcode = false;
    epc_api_connection = true;
    epc_api_error = false;
    hide_ids(['input-address', 'input-box-epc-space-heating', 'input-box-floor-area', 'epc-searching', 'help-address']);
    clear_warnings('address');
    clear_value('epc-space-heating');
    get_check_input_fnc('epc-space-heating', false)();
    clear_value('floor-area');
    get_check_input_fnc('floor-area', false)();
    return "";
}

function check_postcode_format(postcode) {
    if (postcode.length > 4) {
        let outcode_num = postcode.substr(-3, 1);
        let outcode_str = postcode.substr(-2);
        if (!isNaN(outcode_num) && /^[a-zA-Z]+$/.test(outcode_str)) {
            return "";
        }
    }
    return "none";
}

async function validate_postcode(postcode) {
    const postcode_url = 'https://api.postcodes.io/postcodes/' + postcode;
    try {
        const response = await fetch(postcode_url);
        const json = await response.json();
        if (json['status'] == 200) {
            console.log('postcode-api-json:', json);
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
        console.error('postcode-api-error: ', error);
        if (error.message == 'Failed to fetch' || error.message == 'Load failed') {
            return 'io-connection';
        }
        return 'postcodes-io';
    }
}

async function get_address_certificates(postcode) {
    if (!scottish_postcode) {
        const full_url = `${epc_api_url}?postcode=${postcode}`;

        try {
            const response = await fetch(full_url);
            const json = await response.json();
            if (json['status'] == 200) {
                console.log('api-address-certificate-json: ', json);
                let address_element = document.getElementById('input-address');
                while (address_element.getElementsByTagName('option').length > 0) {
                    address_element.removeChild(address_element.lastChild);
                }
                clear_element_validation(address_element);

                let opt1 = document.createElement('option');
                opt1.text = "Select Address";
                opt1.classList.add("color-neutral");
                address_element.appendChild(opt1);
                let opt2 = document.createElement('option');
                opt2.text = "Address Not Listed";
                opt2.classList.add("color-warn");
                address_element.appendChild(opt2);

                for (let [address, certificate] of json.result) {
                    //console.log(address, certificate);
                    let option_element = document.createElement('option');
                    option_element.value = certificate;
                    option_element.classList.add("color-neutral");

                    // capitalise each word
                    address = address.toLowerCase().replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase());

                    option_element.text = address.substring(0, 45);
                    address_element.appendChild(option_element);
                }
                unhide_elements([address_element]);
                return "";
            } else {
                throw new Error(json['error']);
            }
        } catch (error) {
            console.error('api-address-certificate-error: ', error);
            if (error.message == 'Failed to fetch' || error.message == 'Load failed') {
                epc_api_connection = false;
                return "";
            }
            epc_api_error = true;
            return "";
        }
    }
    return "";
}

function show_manual_epc_input() {
    if (scottish_postcode || !epc_api_connection || epc_api_error) {
        unhide_ids(['input-box-epc-space-heating', 'input-box-floor-area']);
    } return "";
}