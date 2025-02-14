Vue.component('column', {
    props: ['columnTitle', 'tasks', 'columnIndex', 'isButton', 'moveTask', 'removeTask'],
    template: `
        <div 
            class="column" 
            @dragover.prevent
            @drop="onDrop($event)"
        >
            <h2>{{ columnTitle }}</h2>
            <button v-if="isButton" @click="addTask">Добавить задачу</button>
            <div 
                v-for="(task, index) in tasks" 
                :key="index" 
                class="task-card" 
                draggable="true"
                @dragstart="onDragStart($event, task)"
            >
                <h3>{{ task.title }}</h3>
                <p>{{ task.description }}</p>
                <p>Создано: {{ task.createdAt }}</p>
                <p>Дэдлайн: {{ task.deadline }}</p>
                <button @click="removeTask(task, columnIndex)">Удалить</button>
            </div>
        </div>
    `,
    methods: {
        addTask() {
            const newTask = {
                id: Date.now(),
                title: 'Новая задача',
                description: 'Описание задачи',
                deadline: '',
                createdAt: new Date().toLocaleString(),
                lastEdited: new Date().toLocaleString(),
                status: 'planned'
            };
            this.tasks.push(newTask);
            this.$emit('save-tasks');
        },
        onDragStart(event, task) {
            // Передаем данные о задаче и текущем столбце
            event.dataTransfer.setData('task', JSON.stringify(task));
            event.dataTransfer.setData('fromColumnIndex', this.columnIndex);
        },
        onDrop(event) {
            // Получаем данные о задаче и исходном столбце
            const task = JSON.parse(event.dataTransfer.getData('task'));
            const fromColumnIndex = event.dataTransfer.getData('fromColumnIndex');

            // Перемещаем задачу в текущий столбец
            this.moveTask(task, fromColumnIndex, this.columnIndex);
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
            ]
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
        moveTask(task, fromColumnIndex, toColumnIndex) {
            // Удаляем задачу из исходного столбца
            this.columns[fromColumnIndex].tasks = this.columns[fromColumnIndex].tasks.filter(t => t.id !== task.id);

            // Добавляем задачу в новый столбец
            this.columns[toColumnIndex].tasks.push(task);

            // Обновляем статус задачи
            task.status = this.columns[toColumnIndex].title.toLowerCase();

            // Сохраняем изменения
            this.saveTasks();
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
          :moveTask="moveTask"
          :removeTask="removeTask"
        />
      </div>
      <button class="qwe" @click="clearStorage">Очистить данные</button>
    </div>
    `
});