import Controller from '@ember/controller';

function validateCsv(data) {
	if(data.length < 3) return false;

	// TODO (make sure all rows have the same length, trailing 1-element array can be ignored)
	return true;
}

function storeList(store, data, listname) {
	// if the last row is only one field long (trailng newline), remove it.
	if(data[data.length -1].length == 1) data.pop();

	const list = store.createRecord('list', {
		name: listname,
	});

	let fielddefs = [];
	for(let col=0; col<data[0].length; col++) {
		let fielddef = store.createRecord('fielddef', {
			title: data[0][col],
			format: data[1][col],
			list: list
		});
		fielddefs[col] = fielddef;
	}

	let cards = [];
	let allFields = [];
	for(let row=2; row<data.length; row++) {
		let card = store.createRecord('card', {
			list: list
		});
		cards.push(card);

		let fields = [];
		for(let col=0; col<data[row].length; col++) {
			let field = store.createRecord('field', {
				card: card,
				fielddef: fielddefs[col],
				content: data[row][col]
			});
			fields[col] = field;
			allFields.push(field);
		}
	}

	// save from bottom to top
	Promise.all(allFields.map(o => o.save()))
		.then(() => Promise.all(cards.map(o => o.save())))
		.then(() => Promise.all(fielddefs.map(o => o.save())))
		.then(() => list.save())

		// and back again...
		.then(() => Promise.all(fielddefs.map(o => o.save())))
		.then(() => Promise.all(cards.map(o => o.save())))
		.then(() => Promise.all(allFields.map(o => o.save())));

}

export default Controller.extend({
	actions: {
		addentry() {
			const list = this.store.createRecord('list', {
				name: "TestListe",
			});

			const fielddef1 = this.store.createRecord('fielddef', {
				format: 'normal',
				list: list
			});

			const card = this.store.createRecord('card', {
				list: list
			});

			const field1 = this.store.createRecord('field', {
				card: card,
				fielddef: fielddef1,
				content: "field1"
			});

			// save from bottom to top
			field1.save()
				.then(function() {
					console.log("saving ", card);
					return card.save();
				})
				.then(function() {
					console.log("saving ", fielddef1);
					return fielddef1.save();
				})
				.then(function() {
					console.log("saving ", list);
					return list.save();
				})

				// save from top to bottom
				.then(function() {
					console.log("saving ", fielddef1);
					return fielddef1.save();
				})
				.then(function() {
					console.log("saving ", card);
					return card.save();
				})
				.then(function() {
					console.log("saving ", field1);
					return field1.save();
				});
		},

		handleFiles(event) {
			const file = event.target.files[0];
			const name = file.name;
			const store = this.store; // so I can access it in callbacks

			// only allow csv mimetype
			if(file.type !== "text/csv") {
				// TODO: Error!
				console.error("Wrong file type!");
				return;
			}

			// discard file ending, if we can detect one
			let listname = (name.indexOf(".") > -1) ? name.substr(0, name.lastIndexOf(".")) : name;

			Papa.parse(file, {
				complete: function(results) {
					console.log("File:", file);
					console.log("Listname:", listname);
					console.log("Finished:", results.data);

					// validate the files
					if (!validateCsv(results.data)) {
						// TODO: Error!
						console.error("Invalid list!");
						return;
					}

					// if there is an old list, remove it completely
					// TODO

					// store the new list
					storeList(store, results.data, listname);
				}
			});
		}
	}
});
