import Controller from '@ember/controller';

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
			Papa.parse(event.target.files[0], {
				complete: function(results) {
					console.log("Finished:", results.data);
				}
			});
		}
	}
});
