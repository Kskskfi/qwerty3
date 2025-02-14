Vue.component('column', {
    props: ['columnTitle', 'tasks', 'columnIndex', 'isButton', 'isFormActive'],
    template: `
        <div 
            class="column" 
            @dragover.prevent
            @drop="onDrop($event)"
        >
            <h2>{{ columnTitle }}</h2>
            <button v-if="isButton" @click="addTask" :disabled="isFormActive">Добавить задачу</button>
            <div 
                v-for="(task, index) in tasks" 
                :key="index" 
                class="task-card" 
                draggable="true"
                @dragstart="onDragStart($event, task)"
            >
                <div v-if="task.isEditing && columnIndex !== 3">
                    <input 
                        type="text" 
                        v-model="task.editTitle" 
                        placeholder="Название задачи (обязательно)"
                        required
                    >
                    <textarea 
                        v-model="task.editDescription" 
                        placeholder="Описание задачи (обязательно)"
                        required
                    ></textarea>
                    <input 
                        type="date" 
                        v-model="task.editDeadline" 
                        placeholder="Дэдлайн (обязательно)"
                        required
                    >
                    <button @click="saveEdit(task)">Сохранить</button>
                    <button @click="cancelEdit(task)">Отмена</button>
                </div>

                <div v-else>
                    <h3>{{ task.title }}</h3>
                    <p>{{ task.description }}</p>
                    <p>Создано: {{ task.createdAt }}</p>
                    <p>Последнее редактирование: {{ task.lastEdited }}</p>
                    <p>Дэдлайн: {{ formatDate(task.deadline) }}</p>
                    <p v-if="isNaN(new Date(task.deadline).getTime())" class="late">Некорректная дата дедлайна</p>
                    <p v-if="task.returnReason" class="return-reason">Причина возврата: {{ task.returnReason }}</p>

                    <!-- Добавляем время завершения и сообщение -->
                    <p v-if="columnIndex === 3">Завершено: {{ task.completedAt }}</p>
                    <p v-if="columnIndex === 3 && task.deadline && task.completedAt" 
                       :class="{'late': isTaskLate(task), 'on-time': !isTaskLate(task)}">
                        {{ isTaskLate(task) ? 'Завершено поздно' : 'Завершено вовремя' }}
                    </p>

                    <div v-if="task.showReturnForm" class="return-form">
                        <input 
                            type="text" 
                            v-model="task.returnReasonInput" 
                            placeholder="Укажите причину возврата"
                        >
                        <button @click="confirmReturn(task)">Подтвердить</button>
                        <button @click="cancelReturn(task)">Отмена</button>
                    </div>

                    <button 
                        class="edit-button" 
                        @click="editTask(task)" 
                        v-if="columnIndex !== 3"
                        :disabled="isFormActive"
                    >
                        Редактировать
                    </button>

                    <button 
                        class="remove-button" 
                        @click="removeTask(task, columnIndex)" 
                        :disabled="isFormActive"
                    >
                        Удалить
                    </button>
                </div>
            </div>
        </div>
    `,
    methods: {
        // Метод для форматирования даты в формат дд.мм.гггг
        formatDate(dateString) {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return "Некорректная дата"; // Если дата некорректна, возвращаем сообщение
            }
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}.${month}.${year}`;
        },
        // Метод для проверки, завершена ли задача поздно
        isTaskLate(task) {
            const deadline = new Date(task.deadline);
            const completedAt = new Date(task.completedAt);

            // Проверка на корректность даты
            if (isNaN(deadline.getTime())) {
                console.error("Некорректная дата дедлайна:", task.deadline);
                return true; // Если дата некорректна, считаем задачу просроченной
            }

            return completedAt > deadline;
        },
        addTask() {
            if (this.isFormActive) return;
            this.$emit('add-task', this.columnIndex);
        },
        onDragStart(event, task) {
            if (this.isFormActive || this.columnIndex === 3) {
                event.preventDefault();
                return;
            }
            event.dataTransfer.setData('task', JSON.stringify(task));
            event.dataTransfer.setData('fromColumnIndex', this.columnIndex);
        },
        onDrop(event) {
            if (this.isFormActive) {
                event.preventDefault();
                return;
            }
            const task = JSON.parse(event.dataTransfer.getData('task'));
            const fromColumnIndex = event.dataTransfer.getData('fromColumnIndex');
            if (fromColumnIndex == 3) {
                event.preventDefault();
                return;
            }
            this.$emit('move-task', task, fromColumnIndex, this.columnIndex);
            if (fromColumnIndex == 2 && this.columnIndex == 1) {
                this.$emit('show-return-form', task);
            }
        },
        confirmReturn(task) {
            if (task.returnReasonInput) {
                this.$emit('confirm-return', task);
            } else {
                alert('Пожалуйста, укажите причину возврата.');
            }
        },
        cancelReturn(task) {
            this.$emit('cancel-return', task);
        },
        editTask(task) {
            task.isEditing = true;
            task.editTitle = task.title;
            task.editDescription = task.description;
            task.editDeadline = task.deadline;
        },
        saveEdit(task) {
            if (!task.editTitle || !task.editDescription || !task.editDeadline) {
                alert("Пожалуйста, заполните все поля: название, описание и дедлайн.");
                return;
            }

            // Проверка на корректность даты дедлайна
            const deadline = new Date(task.editDeadline);
            if (isNaN(deadline.getTime())) {
                alert("Некорректная дата дедлайна. Пожалуйста, введите дату в формате ГГГГ-ММ-ДД.");
                return;
            }

            task.title = task.editTitle;
            task.description = task.editDescription;
            task.deadline = task.editDeadline;
            task.lastEdited = new Date().toLocaleString();
            task.isEditing = false;
            task.isNewTask = false;
            this.$emit('save-tasks');
        },
        cancelEdit(task) {
            this.$emit('cancel-edit', task, this.columnIndex);
        },
        removeTask(task, columnIndex) {
            this.$emit('remove-task', task, columnIndex);
        }
    }
});

new Vue({
    el: '#app',
    data() {
        return {
            columns: [
                { title: 'Запланированные задачи', tasks: [], isButton: true },
                { title: 'Задачи в работе', tasks: [], isButton: false },
                { title: 'Тестирование', tasks: [], isButton: false },
                { title: 'Выполненные задачи', tasks: [], isButton: false }
            ],
            isFormActive: false
        };
    },
    created() {
        this.loadTasks();
    },
    methods: {
        saveTasks() {
            localStorage.setItem('taskBoardData', JSON.stringify(this.columns));
        },
        loadTasks() {
            const savedData = localStorage.getItem('taskBoardData');
            if (savedData) {
                this.columns = JSON.parse(savedData);
            }
        },
        clearStorage() {
            localStorage.removeItem('taskBoardData');
            location.reload();
        },
        addTask(columnIndex) {
            if (this.isFormActive) return;

            const newTask = {
                id: Date.now(),
                title: '',
                description: '',
                deadline: '',
                createdAt: new Date().toLocaleString(),
                lastEdited: new Date().toLocaleString(),
                status: 'planned',
                returnReasonInput: '',
                showReturnForm: false,
                isEditing: true,
                editTitle: '',
                editDescription: '',
                editDeadline: '',
                isNewTask: true
            };

            this.columns[columnIndex].tasks.push(newTask);
            this.saveTasks();
        },
        moveTask(task, fromColumnIndex, toColumnIndex) {
            console.log(`Перемещение задачи из столбца ${fromColumnIndex} в столбец ${toColumnIndex}`);
            this.columns[fromColumnIndex].tasks = this.columns[fromColumnIndex].tasks.filter(t => t.id !== task.id);
            this.columns[toColumnIndex].tasks.push(task);
            task.status = this.columns[toColumnIndex].title.toLowerCase();

            // Добавляем время завершения задачи при перемещении в 4-й столбец
            if (toColumnIndex === 3) {
                task.completedAt = new Date().toLocaleString();
            }

            this.saveTasks();
        },
        showReturnForm(task) {
            task.showReturnForm = true;
            this.isFormActive = true;
        },
        confirmReturn(task) {
            task.returnReason = task.returnReasonInput;
            task.returnReasonInput = '';
            task.showReturnForm = false;
            this.isFormActive = false;
            this.saveTasks();
        },
        cancelReturn(task) {
            task.showReturnForm = false;
            task.returnReasonInput = '';
            this.moveTask(task, 1, 2);
            this.isFormActive = false;
        },
        cancelEdit(task, columnIndex) {
            if (task.isNewTask) {
                this.columns[columnIndex].tasks = this.columns[columnIndex].tasks.filter(t => t !== task);
            }
            task.isEditing = false;
        },
        removeTask(task, columnIndex) {
            this.columns[columnIndex].tasks = this.columns[columnIndex].tasks.filter(t => t !== task);
            this.saveTasks();
        }
    },
    template: `
    <div>
      <div class="board">
        <column
          v-for="(column, index) in columns"
          :key="index"
          :columnTitle="column.title"
          :isButton="column.isButton"
          :tasks="column.tasks"
          :columnIndex="index"
          :isFormActive="isFormActive"
          @add-task="addTask"
          @move-task="moveTask"
          @show-return-form="showReturnForm"
          @confirm-return="confirmReturn"
          @cancel-return="cancelReturn"
          @cancel-edit="cancelEdit"
          @remove-task="removeTask"
        />
      </div>
      <button class="qwe" @click="clearStorage">Очистить данные</button>
    </div>
    `
});