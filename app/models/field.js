import DS from 'ember-data';
import { Model } from 'ember-pouch';

export default Model.extend({
	card: DS.belongsTo('card'),
	fielddef: DS.belongsTo('fielddef'),
	content: DS.attr()
});
