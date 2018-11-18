import Controller from '@ember/controller';

function validateCsv(data) {
	if(data.length < 3) return false;

	// TODO (make sure all rows have the same length, trailing 1-element array can be ignored)
	return true;
}

function deleteList(store, list) {
	Promise.all([
		store.query('fielddef', {filter: {list : list.id}}), // 0
		store.query('card', {filter: {list : list.id}})      // 1
	]).then((results) => {
		let fielddefs = results[0], cards = results[1];

		Promise.all(
			cards.map(c => store.query('field', {filter: {card: c.id}}))
		).then((cardFields) => {

			let fields = [];
			cardFields.forEach(fieldsPerCard => {
				fieldsPerCard.forEach(o => fields.push(o));
			});

			// destroy all fields
			Promise.all(fields.map(f => {
				console.log("destroy field", f.id);
				return f.destroyRecord();
			}))

			// destroy all fielddefs
				.then(() => Promise.all(fielddefs.map(o => {
					console.log("destroy fielddef", o.id);
					return o.destroyRecord();
				})))

			// destroy all cards
				.then(() => Promise.all(cards.map(o => o.destroyRecord())))

			// destroy list
				.then(() => list.destroyRecord());
		});
	});
	//
	// // load all card details, so we get all fields loaded.
	// let cardPromises = list.cards.map(card => store.findRecord('card', card.id));
	//
	// // now everything is loaded, destroy everything!
	// Promise.all(cardPromises).then(function(allCards) {
	// 	console.log("all cards loaded");
	//
	// 	let fields = [];
	// 	allCards.forEach(c => {
	// 		c.fields.forEach(f => fields.push(f))
	// 	});
	//
	// 	store.query('fielddef', {
	// 		filter: {'list' : list.id}
	// 	}).then(x => x.forEach(j => console.log(j.id)));
	//
	// 	store.query('card', {
	// 		filter: {'list' : list.id}
	// 	}).then(x => x.forEach(j => console.log(j.id)));
	//
	//


		// let promises = list.fielddefs.map(o => {
		// 			store.findRecord('fielddef', o.id).then(x => console.log(x)).catch(e => console.log(e));
		// 		});
		// Promise.all(promises).then(() => console.log("done")).catch(() => console.log("error"));
		  // .then(() => {
			// 	console.log("fielddefs done");
			// 	return Promise.all([]);
			// })
			// .then(() => Promise.all(fields.map(o => o.destroyRecord())))
			// .then(() => Promise.all(allCards.map(o => o.destroyRecord())))
			// .then(() => list.destroyRecord())
			// .then(console.log("list " + list.name + " destroyed."));

	// });
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
				deleteList(this.store, list);
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
