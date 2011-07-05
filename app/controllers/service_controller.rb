require 'digest/md5'

class ServiceController < ApplicationController
  before_filter :auth
  before_filter :post_required, :get_code, :except => :index
  
  def index
    @pages = AppConfig.pages
    @contacts_link = AppConfig.contacts.link
  end
  
  def php
    execute("<?php\n" + @code + "\n?>", 'php', '.php')
  end
  
  def ruby
    execute(@code, 'ruby', '.rb')
  end
  
  def bash
    execute(@code, 'bash', '.sh')
  end
  
  def python
    execute(@code, 'python', '.py')
  end
  
  def perl
    execute(@code, 'perl', '.pl')
  end
  
  private
  
  def auth
    return true if !AppConfig.auth.enabled
    authenticate_or_request_with_http_basic do |login, password| 
      login == AppConfig.auth.login && Digest::MD5.hexdigest(password) == AppConfig.auth.password
    end
  end
  
  def post_required
    redirect_to :action => 'index' and return false if request.get?
  end
  
  def get_code
    @code = params['code']
    
    return false if !valid_form { |errors|
      validate_not_empty(errors, 'code', @code)
    }
  end
  
  def valid_form
    errors = []
    yield errors
    render :json => { :errors => errors } and return false if !errors.empty?
    return true
  end
  
  def validate_not_empty(errors, field_name, field)
    errors.push({ :field => field_name, :text => 'Fill the field' }) if field.blank?
  end
  
  def get_random_hash
    chars =  [('a'..'f'),(0..9)].map{ |i| i.to_a }.flatten
    (0..31).map{ chars[rand(chars.length)] }.join
  end
  
  def execute(code, command, extension = '')
    filename = '/tmp/itools_' + get_random_hash + extension
    File.open(filename, 'w') { |f| f.write(code) }
    logger.info("Command (IP #{request.remote_ip}): #{command} #{filename}")
    @output = `sudo -u nobody env TERM=xterm timelimit -t 2 -T 2 #{command} #{filename} 2>&1`
    File.delete(filename)
    
    render :json => { :status => $?.success?, :output => @output }
  end
  
end
