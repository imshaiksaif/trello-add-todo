const api = '2555c181c9e14a675bd24f5721a85e70';
const token = '2ff1d82bd6b02e3688b06266dc8dabbfff0f4d4dfb7fb9ea38ad67a2b4f85ecf';
let boardId = '';
let listId = '';

// get board id
function getBoard() {
	return new Promise((resolve, reject) => {
		fetch(`https://api.trello.com/1/members/me/boards?key=${api}&token=${token}`)
			.then((res) => res.json())
			.then((data) => {
				if (data != undefined) {
					// console.log(data.filter(board => board.name == "trello Project")[0].id)
					resolve(data.filter((board) => board.name == 'trello Project')[0].id);
				} else {
					reject('data not found');
				}
			});
	});
}

//get card
function getCard(checkListId) {
	return new Promise((resolve, reject) => {
		fetch(`https://api.trello.com/1/checklists/${checkListId}/cards?key=${api}&token=${token}`)
			.then((res) => res.json())
			.then((card) => {
				if (card) {
					resolve(card[0].id);
				} else {
					reject('data not found');
				}
			});
	});
}

//reads and writes data from API
function readWriteFromApi(method, url) {
	let data = null;
	let xhr = new XMLHttpRequest();
	xhr.addEventListener('readystatechange', function() {
		if (this.readyState === this.DONE) {
			console.log(this.responseText);
		}
	});
	xhr.open(method, url);
	xhr.send(data);
}

//to read checklist items
function checkListItems() {
	let itemsArray = [];
	return new Promise((resolve, reject) => {
		getBoard().then((id) => {
			fetch(`https://api.trello.com/1/boards/${id}/checklists?checkItem_fields=all&key=${api}&token=${token}`)
				.then((data) => data.json())
				.then((list) => {
					if (list != undefined) {
						list.map((ele) => {
							itemsArray.push(ele);
						});
						resolve(itemsArray);
					} else {
						reject([]);
					}
				});
		});
	});
}

//adding checklist to dom
$(function() {
	// let $todo = $('.new-todo');
	$("#add").keyup((e) => {
		if(e.which === 13) {
			e.preventDefault();
			// debugger;
			// console.log($("#add").val())
			let data = $("#add").val();
			if (data != '' && data != undefined) {
				readWriteFromApi(
					'POST',
					`https://api.trello.com/1/checklists/5d85c4782c382f10ae44d59d/checkItems?&name=${data}&keepFromSource=all&key=${api}&token=${token}`
					);
					$("#add").text("");
					console.log($("#add").val());
        // debugger;
				checkListItems().then((item) => {
					createChecklistItems(item[0].checkItems[item[0].checkItems.length - 1]);
				});
			}
		}
	});
});


// delete checklist items
function deleteChecklistItem(checklistId, itemId) {
	readWriteFromApi(
		'DELETE',
		`https://api.trello.com/1/checklists/${checklistId}/checkItems/${itemId}?key=${api}&token=${token}`
	);
	$('#' + itemId).remove();
}


//display or show checklist
async function displayCheckList() {
	await checkListItems().then((listItems) => {
		listItems.map((item) => {
			item.checkItems.map((checklistItem) => {
				createChecklistItems(checklistItem);
			});
		});
	});
}


//create checklist Items dynamically
function createChecklistItems(checkListItem) {
	let createList = document.createElement('div');
	createList.setAttribute('class', 'card-list');
	createList.setAttribute('id', checkListItem.id);
	let input = document.createElement('input');
	input.setAttribute('type', 'checkbox');
	input.setAttribute('class', 'card-list-input');
	input.setAttribute('id', checkListItem.id);
	input.setAttribute(
		'onClick',
		'updateStatusOfCheckList("' + checkListItem.idChecklist + '","' + checkListItem.id + '")'
	);
	let checkList = document.createElement('spam');
	checkList.setAttribute('class', 'card-name');
	checkList.setAttribute('id', 'checkname' + checkListItem.id);
	checkList.setAttribute(
		'onkeypress',
		'updateChecklistItem("' + checkListItem.idChecklist + '","' + checkListItem.id + '",event)'
	);
	checkList.setAttribute('contenteditable', 'true');
	checkList.innerText = checkListItem.name;

	let deleteIcon = document.createElement('spam');
	deleteIcon.setAttribute('class', 'glyphicon glyphicon-remove remove-icon');
	deleteIcon.setAttribute('onClick', `deleteChecklistItem("${checkListItem.idChecklist}", "${checkListItem.id}")`);

	if (checkListItem.state == 'complete') {
		input.setAttribute('checked', true);
		$(function() {
			$('#checkname' + checkListItem.id).css('text-decoration', 'line-through');
			// console.log($('#checkname'+checkListItem.id))
			// debugger;
		});
	}

	createList.append(input);
	createList.append(checkList);
	createList.append(deleteIcon);
	$('.check-list').append(createList);
}


//update checklist on 
function updateChecklistItem(checkListId, itemId, event) {
	if (event.keyCode == 13) {
		event.preventDefault();
		fetch('https://api.trello.com/1/checklists/' + checkListId + '/cards?key=' + api + '&token=' + token)
			.then((res) => res.json())
			.then((list) => {
				// console.log(list);
				readWriteFromApi(
					'PUT',
					'https://api.trello.com/1/cards/' +
						list[0].id +
						'/checkItem/' +
						itemId +
						'?name=' +
						$('#checkname' + itemId).text() +
						'&state=incomplete&key=' +
						api +
						'&token=' +
						token
				);
			});
	}
}


//checks the status of checklist so that it can make changes (if checked / unchecked)
async function updateStatusOfCheckList(checkListId, itemId) {
	let cardId = await getCard(checkListId).then((val) => {
		return val;
	});
	if ($('input:checkbox[id=' + itemId + ']').is(':checked')) {
		$('#checkname' + itemId).css('text-decoration', 'line-through');
		readWriteFromApi(
			'PUT',
			`https://api.trello.com/1/cards/${cardId}/checkItem/${itemId}?state=complete&checked=true&key=${api}&token=${token}`
		);
	} else {
		$('#checkname' + itemId).css('text-decoration', 'none');
		readWriteFromApi(
			'PUT',
			`https://api.trello.com/1/cards/${cardId}/checkItem/${itemId}?state=complete&checked=false&key=${api}&token=${token}`
		);
	}
}


//Running Checklist function
displayCheckList();

//function to prevent form from submitting
function mySubmit(e) { 
	e.preventDefault(); 
	return false;
  }