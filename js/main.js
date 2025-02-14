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
                <h3>{{ task.title }}</h3>
                <p>{{ task.description }}</p>
                <p>Создано: {{ task.createdAt }}</p>
                <p>Дэдлайн: {{ task.deadline }}</p>
                <p v-if="task.returnReason" class="return-reason">Причина возврата: {{ task.returnReason }}</p>

                
                <div v-if="task.showReturnForm" class="return-form">
                    <input 
                        type="text" 
                        v-model="task.returnReasonInput" 
                        placeholder="Укажите причину возврата"
                    >
                    <button @click="confirmReturn(task)">Подтвердить</button>
                    <button @click="cancelReturn(task)">Отмена</button>
                </div>

                <button @click="removeTask(task, columnIndex)" :disabled="isFormActive">Удалить</button>
            </div>
        </div>
    `,
    methods: {
        addTask() {
            if (this.isFormActive) return;
            this.$emit('add-task', this.columnIndex);
        },
        onDragStart(event, task) {
            if (this.isFormActive) {
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
            const newTask = {
                id: Date.now(),
                title: 'Новая задача',
                description: 'Описание задачи',
                deadline: '',
                createdAt: new Date().toLocaleString(),
                lastEdited: new Date().toLocaleString(),
                status: 'planned',
                returnReasonInput: '',
                showReturnForm: false
            };
            this.columns[columnIndex].tasks.push(newTask);
            this.saveTasks();
        },
        moveTask(task, fromColumnIndex, toColumnIndex) {
            console.log(`Перемещение задачи из столбца ${fromColumnIndex} в столбец ${toColumnIndex}`);

            this.columns[fromColumnIndex].tasks = this.columns[fromColumnIndex].tasks.filter(t => t.id !== task.id);


            this.columns[toColumnIndex].tasks.push(task);


            task.status = this.columns[toColumnIndex].title.toLowerCase();


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
          @remove-task="removeTask"
        />
      </div>
      <button class="qwe" @click="clearStorage">Очистить данные</button>
    </div>
    `
});