import DS from 'ember-data';
import { Model } from 'ember-pouch';

export default Model.extend({
	fielddef: DS.belongsTo('fielddef'),
	content: DS.attr()
});
