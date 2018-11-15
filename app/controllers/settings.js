import Controller from '@ember/controller';

export default Controller.extend({
	actions: {
		addentry() {
			let newdata = this.store.createRecord('list', {
				name: "testeintrag"
			});

			newdata.save();
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
