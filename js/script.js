if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
}
(function () {

    /*
    * Secondary functions
    * */
    function ajax(params) {
        var xhr = new XMLHttpRequest();
        var url = params.url || '';
        var body = params.body || '';
        var success = params.success;
        var error = params.error;

        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.send(body);
        xhr.onload = function () {
            if (xhr.readyState === 4 && xhr.status === 200 && typeof success === 'function') {
                success(xhr.response);
            } else if (xhr.readyState === 4 && xhr.status !== 200 && typeof error === 'function') {
                error(xhr.response);
            }
        };
        xhr.onerror = error || null;
    }

    /*
    * Validation
    * */
    function checkRegExp(pattern, message, value) {
        return pattern.test(value) ? true : message;
    }

    function checkPass(message){
        var pass1 = document.getElementById('password').value;
        var pass2 = document.getElementById('password2').value;
        return (pass1 === pass2) ? true : message;
    }


    var validations = {
        firstName: [
            checkRegExp.bind(null, /^[A-Zа-я]{2,}$/i, 'Field may contain only letters and not be less than 2 letters'),
            checkRegExp.bind(null, /^[A-Zа-я]{2,64}$/i, 'Field may contain only letters and not be more than 64 letters'),
        ],
        lastName: [
            checkRegExp.bind(null, /^[A-Zа-я]{2,}$/i, 'Field may contain only letters and not be less than 2 letters'),
            checkRegExp.bind(null, /^[A-Zа-я]{2,64}$/i, 'Field may contain only letters and not be more than 64 letters'),
        ],
        email: [
            checkRegExp.bind(null,
                /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
                'Please enter valid email'),
        ],
        phone: [
            checkRegExp.bind(null, /^[0-9]{8}$/, 'Field may contain only 8 digits'),
        ],
        password: [
            checkRegExp.bind(null,
                /(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[\!\@\#\$\%\^\&\*\-])/,
                'Required at least one number (0-9), uppercase and lowercase letters (a-Z) and at least one special character (!@#$%^&*-)'),
        ],
        password2: [
            checkRegExp.bind(null,
                /(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[\!\@\#\$\%\^\&\*\-])/,
                'Required at least one number (0-9), uppercase and lowercase letters (a-Z) and at least one special character (!@#$%^&*-)'),
            checkPass.bind(null, 'Must be equal to password'),
        ],
        zip: [
            checkRegExp.bind(null, /^[0-9]{5}$/, 'Field must include 5 digits and only consist of numeric values'),
        ]
    };

    function validateField(element) {
        var fieldValidation = validations[element.id];
        var result = { valid: true, element: element, message: '' };

        if (fieldValidation) {
            for (var i = 0, len = fieldValidation.length; i < len; i++) {
                var validationFunction = fieldValidation[i];
                var answer = validationFunction(element.value);
                if (typeof answer === 'string') {
                    result.valid = false;
                    result.message = answer;
                    break;
                }
            }
        }
        return result;
    }

    /*
    * Other function
    * */
    function toggleError(element, message) {
        var errorMessageElement = element.nextElementSibling && element.nextElementSibling.classList.contains('field-error')
            ? element.nextElementSibling
            : null;

        errorMessageElement && message && (errorMessageElement.innerHTML = message);
        errorMessageElement && !message && (errorMessageElement.innerHTML = '');
    }
    function formOnchange(e) {
        if (e.target.dataset && e.target.dataset.validation !== undefined) {
            toggleError(e.target, validateField(e.target).message);
        }
    }

    /*
   * change steps
   * */

    var steps = [];
    var allsteps = document.querySelectorAll('#mainForm .step');
    allsteps.forEach(function (step) {
        return steps.push(step);
    })
    var nextBtn = document.querySelector('#mainForm .control_next');
    var prevBtn = document.querySelector('#mainForm .control_prev');
    var submitBtn = document.querySelector('#mainForm .control_submit');
    var form = document.querySelector('#mainForm');
    var valid = false;

    nextBtn.addEventListener('click', function () {
        var currentInputs = document.querySelectorAll('#mainForm .step_active input')
        var validInput = []
        currentInputs.forEach(function (input) {
            toggleError(input, validateField(input).message);
            return validInput.push(validateField(input).valid);
        });
        if (validInput.every(function (elem) {
            return elem === true;
        })) {
            changeStep('next')
            return valid = true;
        }
        return valid
    })
    prevBtn.addEventListener('click', function () {
        changeStep('prev');
    });


    function changeStep(btn){
        var index = 0;
        var active = document.querySelector('#mainForm .step_active');
        index = steps.indexOf(active);
        steps[index].classList.remove('step_active');
        if (btn === 'next'){
            index ++;
            nextBtn.classList.add('control_hide')
            prevBtn.classList.remove('control_hide')
            submitBtn.classList.remove('control_hide')
        } else if (btn === 'prev'){
            index --;
            nextBtn.classList.remove('control_hide')
            prevBtn.classList.add('control_hide')
            submitBtn.classList.add('control_hide')
        }
        steps[index].classList.add('step_active')
    }

    function checkZipStatus(e) {
        var currentInputs = document.querySelectorAll('#mainForm .step_active input');
        var zip = e.target.value;
        var params = {
            url: './api/geoStatus.php',
            body: "zip=" + zip,
            success: function success(_success) {
                if (_success === 'allowed') {
                    getZipData(zip);
                } else if (_success === 'blocked') {
                    currentInputs.forEach(function (input) {
                        input.value = '';
                        if (input.id === 'city' || input.id === 'state') {
                            input.setAttribute('disabled', true);
                        }
                    });
                    alert('Zip is blocked');
                }
            },
            error: function error() {
                console.log('error');
            }
        };
        ajax(params);
    }

    var getZipData = function getZipData(zip) {
        var params = {
            url: './api/geoData.php',
            body: "zip=" + zip,
            success: function success(_success2) {
                var data = JSON.parse(_success2);
                var inputState = document.getElementById('state')
                var inputCity = document.getElementById('city')
                inputState.value = data.state;
                inputState.removeAttribute('disabled')
                inputCity.value = data.city;
                inputCity.removeAttribute('disabled')
            },
            error: function error() {
                console.log('error');
            }
        };
        ajax(params);
    };


    /*
    * Listeners
    * */
    document.getElementById('mainForm').addEventListener('change', formOnchange);
    document.getElementById('zip').addEventListener('change', checkZipStatus);
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var zip = document.getElementById('zip');
        toggleError(zip, validateField(zip).message);
    });
})();
