import Controller from '@ember/controller';

function validateCsv(data) {
	if(data.length < 3) return false;

	// TODO (make sure all rows have the same length, trailing 1-element array can be ignored)
	return true;
}


function deleteList(store, list) {
	return Promise.all([
		store.query('fielddef', {
			filter: { list: list.id, format: {'$exists': true}} // bad dobby!
		}),
		store.query('card', {
			filter: { list: list.id, format: {'$exists': false}}
		})
	]).then((results) => {
		let fielddefs = results[0], cards = results[1];

		// delete all fields of the card - and the card afterwards
		return Promise.all(cards.map(card => {
			return store.query('field', {
				filter: { card: card.id}
			})
			.then(fields => Promise.all(fields.map(o => {
				console.log("destroy field", o.id);
				return o.destroyRecord();
			})))
			.then(() => console.log("fields destroyed."))

			.then(() => {
				console.log("destroy card", card.id);
				return card.destroyRecord();
			})
			.then(() => console.log("card destroyed."));
		}))

		// delete all fielddefs
		.then(() => Promise.all(fielddefs.map(o => {
			console.log("destroy fielddef", o.id);
			return o.destroyRecord();
		})))
		.then(() => console.log("fielddefs destroyed."))

		// delete list
		.then(() => {
			console.log("destroy list", list.id);
			return list.destroyRecord();
		})
		.then(() => console.log("list destroyed."));
	});
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
			order: col,
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
		handleFiles(event) {
			const file = event.target.files[0];
			const name = file.name;
			const store = this.store; // so I can access it in callbacks

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
						alert("Invalid list!");
						return;
					}

					store.queryRecord('list', {
						filter: {name: listname}
					}).then(function (oldlist) {
						if(oldlist != null) {
							if(!confirm("Liste " + listname + " existiert schon. Ersetzen?")) {
								alert("Hochladen abgebrochen.");
								return;
							} else {
								deleteList(store, oldlist);
							}
						}

						// no objections, we can store the list
						storeList(store, results.data, listname);
					});
				}
			});
		},

		deleteList(list) {
			if(confirm("Liste " + list.name + " wirklich löschen?"))
				deleteList(this.store, list)
				.then(() => console.log("deletion successfull"));
		},

		test() {
			this.store.queryRecord('list', {
				filter: {name: "dsa4-zauber"}
			})
				.then(function(list) {
					console.log(list.id, list.name);
				});
		}
	}
});
