ActionController::Routing::Routes.draw do |map|
  map.root :controller => 'service'
  
  map.connect ':controller/:action/:id'
  map.connect ':controller/:action/:id.:format'
end
