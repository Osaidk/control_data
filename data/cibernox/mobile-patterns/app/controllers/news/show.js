import Ember from 'ember';

export default Ember.Controller.extend({
  sample: 'value',
  config: Ember.inject.service()
});
