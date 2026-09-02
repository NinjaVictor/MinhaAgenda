const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

const todayISO = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

let data = JSON.parse(
  localStorage.getItem("agendaV1") ||
  '{"events":[],"tasks":[],"notes":[]}'
);

let selectedDate = todayISO();
let viewDate = new Date();

function save() {
  localStorage.setItem("agendaV1", JSON.stringify(data));
}

function formatDate(date) {
  return new Date(date + "T12:00:00").toLocaleDateString(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }
  );
}

function escapeHTML(text) {
  return String(text ?? "").replace(
    /[&<>"']/g,
    (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m])
  );
}

function toast(message) {
  const element = $("#toast");

  element.textContent = message;

  element.classList.add("show");

  setTimeout(() => {
    element.classList.remove("show");
  }, 1800);
}


/* =========================
   RENDERIZAÇÃO PRINCIPAL
========================= */

function render() {

  $("#dateText").textContent =
    new Date().toLocaleDateString(
      "pt-BR",
      {
        weekday: "long",
        day: "numeric",
        month: "long"
      }
    );

  $("#eventCount").textContent =
    data.events.length;

  $("#taskCount").textContent =
    data.tasks.filter(
      task => !task.done
    ).length;

  $("#noteCount").textContent =
    data.notes.length;

  renderHome();
  renderCalendar();
  renderEvents();
  renderTasks();
  renderNotes();
}


/* =========================
   TELA INICIAL
========================= */

function renderHome() {

  const events = [...data.events]
    .sort(
      (a, b) =>
        (a.date + a.time)
        .localeCompare(b.date + b.time)
    )
    .slice(0, 3);

  $("#homeEvents").innerHTML =
    events.length
      ? events.map(eventItem).join("")
      : `
        <div class="empty">
          Nenhum compromisso cadastrado.
        </div>
      `;

  const tasks = data.tasks
    .filter(task => !task.done)
    .slice(0, 3);

  $("#homeTasks").innerHTML =
    tasks.length
      ? tasks.map(taskItem).join("")
      : `
        <div class="empty">
          Tudo em dia 🎉
        </div>
      `;

  bindItemButtons();
}


/* =========================
   COMPROMISSOS
========================= */

function eventItem(event) {

  return `
    <div class="item">

      <i class="dot"></i>

      <div class="item-main">

        <div class="item-title">
          ${escapeHTML(event.title)}
        </div>

        <div class="item-meta">

          ${formatDate(event.date)}

          ${
            event.time
              ? " • " + escapeHTML(event.time)
              : ""
          }

          ${
            event.place
              ? " • " + escapeHTML(event.place)
              : ""
          }

        </div>

      </div>

      <button
        class="delete"
        data-del-event="${event.id}">
        ×
      </button>

    </div>
  `;
}


/* =========================
   TAREFAS
========================= */

function taskItem(task) {

  return `
    <div class="item ${task.done ? "done" : ""}">

      <button
        class="check ${task.done ? "done" : ""}"
        data-toggle-task="${task.id}">

        ${task.done ? "✓" : ""}

      </button>

      <div class="item-main">

        <div class="item-title">
          ${escapeHTML(task.title)}
        </div>

        <div class="item-meta">

          ${
            task.date
              ? formatDate(task.date)
              : "Sem data"
          }

          ${
            task.priority
              ? " • " + escapeHTML(task.priority)
              : ""
          }

        </div>

      </div>

      <button
        class="delete"
        data-del-task="${task.id}">
        ×
      </button>

    </div>
  `;
}


/* =========================
   CALENDÁRIO
========================= */

function renderCalendar() {

  const year =
    viewDate.getFullYear();

  const month =
    viewDate.getMonth();

  $("#monthTitle").textContent =
    new Date(year, month, 1)
      .toLocaleDateString(
        "pt-BR",
        {
          month: "long",
          year: "numeric"
        }
      );

  const firstDay =
    new Date(year, month, 1)
      .getDay();

  const days =
    new Date(year, month + 1, 0)
      .getDate();

  let output = "";

  for (
    let i = 0;
    i < firstDay;
    i++
  ) {
    output += "<span></span>";
  }

  for (
    let day = 1;
    day <= days;
    day++
  ) {

    const iso =
      `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    let classes = "day ";

    if (iso === todayISO()) {
      classes += "today ";
    }

    if (iso === selectedDate) {
      classes += "selected ";
    }

    if (
      data.events.some(
        event => event.date === iso
      )
    ) {
      classes += "has-event";
    }

    output += `
      <button
        class="${classes}"
        data-date="${iso}">
        ${day}
      </button>
    `;
  }

  $("#calendarGrid").innerHTML =
    output;

  $$(".day").forEach(
    button => {

      button.onclick = () => {

        selectedDate =
          button.dataset.date;

        render();

      };

    }
  );
}


/* =========================
   EVENTOS DO DIA
========================= */

function renderEvents() {

  const events =
    data.events
      .filter(
        event =>
          event.date === selectedDate
      )
      .sort(
        (a, b) =>
          a.time.localeCompare(b.time)
      );

  $("#selectedDateTitle").textContent =
    "Compromissos • " +
    formatDate(selectedDate);

  $("#eventList").innerHTML =
    events.length
      ? events.map(eventItem).join("")
      : `
        <div class="empty">
          Nenhum compromisso neste dia.
        </div>
      `;

  bindItemButtons();
}


/* =========================
   LISTA DE TAREFAS
========================= */

function renderTasks() {

  const tasks =
    [...data.tasks].sort(
      (a, b) =>
        Number(a.done) -
        Number(b.done)
    );

  $("#taskList").innerHTML =
    tasks.map(taskItem).join("");

  $("#emptyTasks").style.display =
    tasks.length
      ? "none"
      : "block";

  bindItemButtons();
}


/* =========================
   NOTAS
========================= */

function renderNotes() {

  const search =
    $("#noteSearch").value
      .toLowerCase();

  const notes =
    data.notes.filter(
      note =>
        (
          note.title +
          " " +
          note.text
        )
        .toLowerCase()
        .includes(search)
    );

  $("#noteList").innerHTML =
    notes.map(
      note => `
        <article class="note">

          <button
            class="delete"
            data-del-note="${note.id}">
            ×
          </button>

          <h4>
            ${escapeHTML(
              note.title || "Sem título"
            )}
          </h4>

          <p>
            ${escapeHTML(note.text)}
          </p>

        </article>
      `
    ).join("");

  $("#emptyNotes").style.display =
    notes.length
      ? "none"
      : "block";

  bindItemButtons();
}


/* =========================
   BOTÕES
========================= */

function bindItemButtons() {

  $$("[data-del-event]").forEach(
    button => {

      button.onclick = () => {

        data.events =
          data.events.filter(
            event =>
              event.id !=
              button.dataset.delEvent
          );

        save();

        render();

        toast(
          "Compromisso apagado"
        );

      };

    }
  );


  $$("[data-del-task]").forEach(
    button => {

      button.onclick = () => {

        data.tasks =
          data.tasks.filter(
            task =>
              task.id !=
              button.dataset.delTask
          );

        save();

        render();

        toast(
          "Tarefa apagada"
        );

      };

    }
  );


  $$("[data-toggle-task]").forEach(
    button => {

      button.onclick = () => {

        const task =
          data.tasks.find(
            task =>
              task.id ==
              button.dataset.toggleTask
          );

        if (task) {
          task.done =
            !task.done;
        }

        save();

        render();

      };

    }
  );


  $$("[data-del-note]").forEach(
    button => {

      button.onclick = () => {

        data.notes =
          data.notes.filter(
            note =>
              note.id !=
              button.dataset.delNote
          );

        save();

        render();

        toast(
          "Nota apagada"
        );

      };

    }
  );

}


/* =========================
   ABRIR FORMULÁRIO
========================= */

function openModal(type) {

  $("#modal")
    .classList
    .remove("hidden");

  let title;

  if (type === "event") {
    title = "Novo compromisso";
  }

  if (type === "task") {
    title = "Nova tarefa";
  }

  if (type === "note") {
    title = "Nova nota";
  }

  $("#modalTitle").textContent =
    title;


  let fields = "";


  /* EVENTO */

  if (type === "event") {

    fields = `

      <div class="field">

        <label>Título</label>

        <input
          name="title"
          required
          placeholder="Ex.: Reunião">

      </div>


      <div class="field">

        <label>Data</label>

        <input
          name="date"
          type="date"
          value="${selectedDate}"
          required>

      </div>


      <div class="field">

        <label>Horário</label>

        <input
          name="time"
          type="time">

      </div>


      <div class="field">

        <label>Local</label>

        <input
          name="place"
          placeholder="Opcional">

      </div>


      <div class="field">

        <label>Observações</label>

        <textarea
          name="text"
          placeholder="Detalhes...">
        </textarea>

      </div>

    `;
  }


  /* TAREFA */

  if (type === "task") {

    fields = `

      <div class="field">

        <label>Tarefa</label>

        <input
          name="title"
          required
          placeholder="Ex.: Fazer trabalho">

      </div>


      <div class="field">

        <label>Data</label>

        <input
          name="date"
          type="date"
          value="${selectedDate}">

      </div>


      <div class="field">

        <label>Prioridade</label>

        <select name="priority">

          <option>Normal</option>
          <option>Alta</option>
          <option>Baixa</option>

        </select>

      </div>

    `;
  }


  /* NOTA */

  if (type === "note") {

    fields = `

      <div class="field">

        <label>Título</label>

        <input
          name="title"
          placeholder="Ex.: Ideias">

      </div>


      <div class="field">

        <label>Nota</label>

        <textarea
          name="text"
          required
          placeholder="Escreva aqui...">
        </textarea>

      </div>

    `;
  }


  $("#formFields").innerHTML =
    fields;

  $("#form").dataset.type =
    type;
}


/* =========================
   SALVAR FORMULÁRIO
========================= */

$("#form").onsubmit = (event) => {

  event.preventDefault();

  const form =
    new FormData(event.target);

  const object =
    Object.fromEntries(form.entries());

  object.id =
    Date.now();


  const type =
    event.target.dataset.type;


  if (type === "event") {

    data.events.push(object);

  }


  else if (type === "task") {

    object.done = false;

    data.tasks.push(object);

  }


  else if (type === "note") {

    data.notes.push(object);

  }


  save();

  $("#modal")
    .classList
    .add("hidden");

  event.target.reset();

  render();

  toast(
    "Salvo com sucesso!"
  );

};


/* =========================
   FECHAR MODAL
========================= */

$("#closeModal").onclick =
  () => {

    $("#modal")
      .classList
      .add("hidden");

  };


$("#modal").onclick =
  (event) => {

    if (
      event.target.id === "modal"
    ) {

      $("#modal")
        .classList
        .add("hidden");

    }

  };


/* =========================
   BOTÕES DE ADICIONAR
========================= */

$$("[data-action]").forEach(
  button => {

    button.onclick = () => {

      openModal(
        button.dataset.action
      );

    };

  }
);


/* =========================
   NAVEGAÇÃO
========================= */

$$("[data-tab]").forEach(
  button => {

    button.onclick = () => {

      const tab =
        button.dataset.tab;

      $$(".screen").forEach(
        screen => {

          screen.classList.toggle(
            "active",
            screen.id === tab
          );

        }
      );

      $$(".nav").forEach(
        nav => {

          nav.classList.toggle(
            "active",
            nav.dataset.tab === tab
          );

        }
      );

    };

  }
);


/* =========================
   MUDAR MÊS
========================= */

$("#prevMonth").onclick = () => {

  viewDate.setMonth(
    viewDate.getMonth() - 1
  );

  renderCalendar();

};


$("#nextMonth").onclick = () => {

  viewDate.setMonth(
    viewDate.getMonth() + 1
  );

  renderCalendar();

};


/* =========================
   PESQUISA DE NOTAS
========================= */

$("#noteSearch").oninput =
  renderNotes;


/* =========================
   MODO ESCURO
========================= */

$("#themeBtn").onclick = () => {

  document.body.classList.toggle(
    "dark"
  );

  const dark =
    document.body.classList.contains(
      "dark"
    );

  localStorage.setItem(
    "dark",
    dark
  );

  $("#themeBtn").textContent =
    dark ? "☀" : "☾";

};


if (
  localStorage.getItem("dark") === "true"
) {

  document.body.classList.add(
    "dark"
  );

  $("#themeBtn").textContent =
    "☀";

}


/* =========================
   INICIAR
========================= */

render();