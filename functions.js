// variables / html nodes
const container = document.getElementById("container");
const curryIdField = document.getElementById("curry-id");

// loading icon
loadingIcon = 'Spinner-3.gif';

// order in which courses are displayed
var courseOrder = ['General', 'Combination', 'Juniors', 'Seniors', 'Business', 'Private', 'DomainSpecific', 'LanguagePlus', 'Exam', 'Teacher', 'University', 'WorkExperience', 'LivingWithTeacher', 'AuPair', 'Other', 'AdditionalCourses'];

// sort courses
function sortCourses(array) {
  // if course kind is an object replace new_kind with general term
  for (i = 0; i < array.length; i++) {
    array[i].new_kind = typeof array[i].new_kind === 'object' ? Object.keys(array[i].new_kind)[0] : array[i].new_kind;
  }
  // create sort-order from array
  const orderIndex = {};
  for (j = 0; j < courseOrder.length; j++) {
    orderIndex[courseOrder[j]] = j;
  }
  // sort courses (by kind or if equal by number of lessons)
  array.sort(function (a, b) {
    return orderIndex[a.new_kind] - orderIndex[b.new_kind] || (a.lessons || a.num_private_lessons) - (b.lessons || b.num_private_lessons);
  });
  return array;
}

// check if course already has an UUID
function hasUUID(course) {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(course.coursepage_info.trim());
}

// get UUID from uuidtools.com
async function getUUID() {
  let response = await fetch('https://www.uuidtools.com/api/generate/v4');
  let array = await response.json();
  return array[0];
}

// generate table with courses and UUID-copy-buttons
async function makeUUIDbuttons() {

  let response = await fetch(`https://api.sww.curry-software.com/api/school/${curryIdField.value}`);
  let data = await response.json();
  let courses = sortCourses(data.courses);

  container.innerHTML += `
    <h2>${data.name} (${courses.length} Kurse)</h2>
    <div id="loader"><img src="${loadingIcon}" /></div>
  `;

  let table = document.createElement('table');
  table.setAttribute('border', '1');
  table.setAttribute('cellPadding', '15');
  table.style.borderCollapse = 'collapse';
  table.style.margin = '0 auto';

  table.innerHTML = `
    <tr>
      <th style="width: 40px;">Aktiv?</th>
      <th style="width: 300px;">Kurs</th>
      <th>Kursart</th>
      <th style="width: 300px;">UUID kopieren</th>
    </tr>
  `;

  for (let i = 0; i < courses.length; i++) {
    let uuid = await getUUID();
    let uuidRow = document.createElement("tr");
    uuidRow.style.backgroundColor = i % 2 ? 'white' : 'lightgrey';
    uuidRow.innerHTML = `
      <td style="background-color: ${courses[i].active ? 'green' : 'red'};"></td>
      <td>${courses[i].name}</td>
      <td>${courses[i].new_kind}</td>
      <td>
        ${hasUUID(courses[i]) ? `
          <strong>Kurs hat bereits eine UUID!</strong>
          <br><br>
          ( ${courses[i].coursepage_info.trim()} )
        ` : `
          <button 
            id="${uuid}" 
            class="uuid-button"
            data-curryId="${courses[i].id}" 
            style="color: white; background-color: green; border-radius: 8px; cursor: pointer; padding: 5px;"
          >
            COPY ${uuid}
          </button>
        `}
      </td>
    `;
    table.appendChild(uuidRow);
  }

  document.getElementById('loader').style.display = 'none';
  container.appendChild(table);

}

// main generate function
async function generateUUIDs() {

  container.innerHTML = '';

  await makeUUIDbuttons()
    .then(() => {

      let uuidButtons = document.querySelectorAll('.uuid-button');

      for (let i = 0; i < uuidButtons.length; i++) {
        uuidButtons[i].addEventListener('click', function (e) {
          e.preventDefault();
          if (uuidButtons[i].getAttribute('data-used')) {
            alert(`WARNING:\n\nUUID ${uuidButtons[i].id} was already used!`)
          }
          // copy UUID to clipboard
          const textArea = document.createElement("textarea");
          textArea.value = uuidButtons[i].id;
          uuidButtons[i].appendChild(textArea);
          textArea.focus();
          textArea.select();
          try {
            document.execCommand('copy');
          } catch (err) {
            console.error('Unable to copy to clipboard', err);
          }
          uuidButtons[i].removeChild(textArea);

          uuidButtons[i].innerText = `USED ${uuidButtons[i].id}`;
          uuidButtons[i].setAttribute('data-used', true);
          uuidButtons[i].style.backgroundColor = 'red';

          let courseId = uuidButtons[i].getAttribute('data-curryId') || null;

          if (courseId) {
            window.open(`https://sww.curry-software.com/#/edit/course/${curryIdField.value}/${courseId}?`, '_blank');
          }

        });
      }

    })

}

// load curry id from url params (if any)
const query = window.location.search;
const params = new URLSearchParams(query);
if (params.has('curryId')) curryIdField.value = params.get('curryId');