if (typeof String.prototype.contains === 'undefined') {
  String.prototype.contains = function(substring) {
   return this.indexOf(substring) != -1;
  };
}

RMPlus.Usability = (function (my) {
  var my = my || {};

  my.underlineMenusAndIcons = function () {
    $('#admin-menu ul li a, a.repository, #top-menu a, #main-menu a, a.icon, #content > .contextual:first > a').not('.no_line').each(function (index) {
      $(this).addClass('no_line');
    });
    $('a.no_line, #admin-menu a, a.repository, #top-menu a, #main-menu a').not(':has(span)').each(function(index) {
      if ($(this).html() == $(this).text()) {
        $(this).html('<span>'+$(this).html()+'</span>');
      }
    });
  };


  my.underlineTabs = function () {
    $('div.tabs ul li a').each(function(index) {
      $(this).addClass('no_line in_link');
      $(this).html('<span>'+$(this).html()+'</span>');
    });
  };

  my.show_flashes = function (message_error, message_notice) {
    $('.flash').remove();
    if (typeof message_error != 'undefined' && message_error != '') {
        $('#content').prepend('<div id="flash_error" class="flash error">' + message_error + '</div>');
        window.scrollTo(0, 0);
    }
    if (typeof message_notice != 'undefined' && message_notice != '') {
        $('#content').prepend('<div id="flash_notice" class="flash notice">' + message_notice + '</div>');
        window.scrollTo(0, 0);
    }
  };

  my.makePieCharts = function (element) {
    if (RMPlus.Utils.exists('Usability.settings.usability_progress_bar_type') && RMPlus.Usability.settings.usability_progress_bar_type == 'pie') {
      $('.pie-chart', $(element)).each(function () {
        if (!$(this).attr('data-piecharted')) {
          var radius = parseInt(this.getAttribute('data-radius'));
          var pcts = JSON.parse(this.getAttribute('data-pcts'));
          var border_width = parseFloat(this.getAttribute('data-border-width'));
          var labels = [];
          Raphael(this, 2*(radius + border_width), 2*(radius + border_width)).pieChart(radius+border_width, radius+border_width, radius, pcts, border_width, labels);
          this.setAttribute('data-piecharted', 'true');
        }
      });
    }
  };

  my.add_total_sum_to_issue_queries = function () {
    if (!RMPlus.Utils.exists('Usability.settings.totals_in_queries') || !RMPlus.Usability.settings.totals_in_queries) { return; }

    var totals = [];
    var group_totals = [];
    var table = $('#content div.autoscroll table.list.issues:not(.lp_table)');

    var add_totals = function (element, totals, before) {
      if (totals.length == 0) { return; }
      var html = '';
      for (var sch = 0; sch < totals.length; sch ++) {
        html += "<td>" + (totals[sch] && totals[sch] != 0 ? parseFloat(totals[sch]).toFixed(2) : '&nbsp;') + "</td>";
      }
      if (before) {
        element.before('<tr><td class="us_row_divider" colspan="' + totals.length.toString() + '"></td></tr><tr>' + html + '</tr>');
      }
      else {
        element.append('<tr><td class="us_row_divider" colspan="' + totals.length.toString() + '"></td></tr><tr>' + html + '</tr>');
      }
    };
    var done_rows = 0;
    var has_groups = false;
    table.find('tbody tr').each(function () {
      var tr = $(this);
      if (tr.hasClass('group')) {
        if (done_rows > 1) {
          has_groups = true;
          if (group_totals.length == 0) { return; }
          add_totals.call(this, tr, group_totals, true);
          group_totals = [];
        }
      } else {
        tr.children().each(function (index) {
          var val = this.innerHTML.replace(' ', '');
          totals[index] = totals[index] || 0;
          group_totals[index] = group_totals[index] || 0;
          if (val == '' || val == 'x') { return; }
          if (isNaN(parseFloat(val)) || !isFinite(val)) { totals[index] = undefined; return; }
          val = parseFloat(val);

          totals[index] = (totals[index]) ? (totals[index]+val) : val;
          group_totals[index] = (group_totals[index]) ? (group_totals[index]+val) : val;
        });
      }
      done_rows++;
    });
    if (has_groups) { add_totals.call(this, table, group_totals); }
    add_totals.call(this, table, totals);
  };

  image_pattern = /\.([0-9a-z]+)(?:[\?#]|$)/i;
  image_extentions = "bmp|gif|jpg|jpe|jpeg|png";

  function getFileExtention (string) {
    result = string.match(image_pattern);
    if (result != null) {
      return result[1].toLowerCase();
    }
    return null;
  };

  my.fileIsImage = function (string) {
    var extention = getFileExtention(string);
    return image_extentions.contains(extention);
  };

  my.createGallery = function (parent_element, gallery_name) {
    var image_index = 0;
    var galleryMap = [];
    $('a', $(parent_element)).each(function () {
      var $this = $(this);
      if (my.fileIsImage(this.href)) {
        if (this.href.contains('/attachments/download')) {
          $this.addClass('gallery-item');
          $this.attr('gallery-name', gallery_name);
          var path_segments = this.href.split('/');
          var id = path_segments[path_segments.indexOf('download') + 1];
          $this.attr('data-id', id);
          galleryMap[image_index] = this.href;
          image_index++;
        } else if (this.href.contains('/attachments')) {
          $this.addClass('gallery-thumbnail');
          var path_segments = this.href.split('/');
          var id = path_segments[path_segments.indexOf('attachments') + 1];
          $this.attr('data-id', id);
        }
      }
    });

    $(parent_element).attr('gallery-map', galleryMap);

    // create gallery if there are any images
    if (image_index > 0) {
      $('.gallery-item', $(parent_element)).magnificPopup(my.galleryPopupSettings);
    }

    // catch click on thumbnail and open gallery using href-index map
    $('.gallery-item, .gallery-thumbnail, .gallery-thumbnail', $(parent_element)).on('click', function (event) {
      if (event.which === 2) {
        if ($(event.target).is('span')) {
          window.open(event.target.parentNode.href);
          return false;
        }
        else if ($(event.target).is('a, img')) {
          window.open(event.target.parentNode.href);
          return false;
        }
      }
      var data_id = this.getAttribute('data-id');
      var url_part = 'attachments/download/' + data_id;
      for (i = 0, len = galleryMap.length; i < len; i++) {
        // null check necessary since array is sparse
        if (galleryMap[i] != null && galleryMap[i].contains(url_part)) {
          $('.gallery-item', $(parent_element)).magnificPopup('open', i);
          return false;
        }
      }
    });
  };

  my.hide_sidebar = function (t) {
    var content = $('#content');
    var sidebar = $('#sidebar');

    content.data('margin-right', content.css('margin-right'));

    var vertical_links = sidebar.find('.us-sb-vr').clone();
    if (vertical_links.length > 0) {
      sidebar.children().not('#close_sidebar_icon').hide();
      var ul = $('<ul id="us-sb-vr-links"></ul>');
      ul.append(vertical_links.wrap('<li class="us-text-orientation" />').parent());
      sidebar.prepend(ul);
      sidebar.data('width', sidebar.width());
      sidebar.css('width', '4em');
      sidebar.prepend(t);
      content.css('margin-right', '4em');
    } else {
      sidebar.hide();
      sidebar.before(t);
      content.css('margin-right', '16px');
    }
    t.addClass('show_sidebar');
    t.removeClass('close_sidebar');

    localStorage["sidebar_closed"] = true;
  };

  my.show_sidebar = function (t) {
    var content = $('#content');
    var sidebar = $('#sidebar');
    if (sidebar.is(':visible')) {
      sidebar.find('#us-sb-vr-links').remove();
      sidebar.width(sidebar.data('width'));
      sidebar.children().show();
    } else {
      sidebar.show();
    }
    t.removeClass('show_sidebar');
    t.addClass('close_sidebar');
    content.css('margin-right', content.data('margin-right'));
    sidebar.prepend(t);
    localStorage["sidebar_closed"] = false;
  };

  my.us_easy_perplex_actions_submit = function () {
    $(document.body).data('ajax_emmiter', $('#s2id_us-subordinates-select2')); //#us-perplex-loader
    $("#us_subordinate_form").submit();
  };

  return my;
})(RMPlus.Usability || {});

$(window).load(function () {

  // Do images magic, if magnificPopup is enabled on the page
  if ($.magnificPopup != null) {
    // let's create main gallery for issue or sd_request
    if ($('div.issue').length > 0) {
      RMPlus.Usability.createGallery($('div.issue').get(0), 'main');
      if ($('#tab-content-history').length > 0) {
        // console.log('FOR HISTORY')
        RMPlus.Usability.createGallery($('#tab-content-history').get(0), 'history');
      }
      if ($('#tab-content-comments').length > 0) {
        RMPlus.Usability.createGallery($('#tab-content-comments').get(0), 'comments');
      }
    }
  }

});

$(document).ready(function () {

  if (RMPlus.Utils.redmine_version < '3.3.0') {
    $("div[id$='CustomField'] > .list > thead > tr").append("<th></th>");
    $("div[id$='CustomField'] > .list > tbody tr").append("<td class='ordered-hndl'> ≡ </td>");
    $("div[id$='CustomField'] > .list > tbody").sortable({
      cursor: 'move',
      opacity: 0.6,
      handle: '.ordered-hndl',
      helper: function (e, tr) {
        var cl = tr.clone();
        cl.height(tr.outerHeight() - 1);
        cl.css({padding: 0, borderTop: '#ccc solid 1px', borderLeft: '#ccc solid 1px'});
        var $originals = tr.children();
        cl.children().each(function (index) {
          $(this).width($originals.eq(index).width() + 1);
        });
        return cl;
      },
      update: function (event, ui) {
        $.ajax({
          type: 'POST',
          data: {
            custom_field_id: ui.item.find('.buttons > a[data-method="delete"]').attr('href').split('/').pop(),
            new_position: ui.item.index()
          },
          url: RMPlus.Utils.relative_url_root + "/custom_fields/move_position"
        });
      }
    });
  }

  $(document.body).on('mousedown', '.gallery-item', function(event) {
    if (event.which === 2) {
      return false;
    }
    // console.log(event);
  });

  RMPlus.Usability.makePieCharts(document.body);
  RMPlus.Usability.add_total_sum_to_issue_queries();

  $('#add_filter_select, #available_columns, #group_by, #query_sort_criteria_attribute_0, #query_sort_criteria_attribute_1, #query_sort_criteria_attribute_2').each(function () {
    var $this = $(this);
    var selected = $this.children('option[selected=selected]'); //Only for firefox

    $this.children('option').sort(function (a, b) {
            $a = $(a); $b = $(b);
            if ($a.text() == 'NA') {
              return 1;
            }
            else if ($b.text() == 'NA') {
              return -1;
            }
            return ($a.text().toLowerCase() > $b.text().toLowerCase()) ? 1 : -1;
          }).appendTo($this);
    selected.prop('selected', true); //Only for firefox
  });


  $('#permissions fieldset').each(function () {
    var $this = $(this);
    $this.find('label').sort(function (a, b) {
      $a = $(a); $b = $(b);
      return ($a.text().toLowerCase() > $b.text().toLowerCase()) ? 1 : -1;
    }).appendTo($this);
  });


  // Disables standart redmine ajax preloader
  if (RMPlus.Utils.exists('Usability.settings.disable_ajax_preloader') && (RMPlus.Usability.settings.disable_ajax_preloader === 'true')) {
    $('#ajax-indicator').remove();
  }

  $(document.body).on('click', 'form[data-remote="true"] input[type=submit], a.icon-del[data-remote="true"], a.show_loader[data-remote="true"]', function () {
    jQuery(document.body).data('ajax_emmiter', jQuery(this));
    // console.log('Emmited ajax event')
  });

  $(document).ajaxStart(function () {
    obj = jQuery(document.body).data('ajax_emmiter');
    if (obj && obj.length > 0) {
      obj.after('<div class="loader" style="width:'+obj.outerWidth().toString()+'px; height: '+obj.outerHeight().toString()+'px;"></div>');
      obj.addClass('ajax_hidden_emmiter');
      obj.hide();
    }
    jQuery(document.body).removeData('ajax_emmiter');
  });

  $(document).ajaxStop(function () {
    jQuery("div.loader:empty").remove();
    jQuery('.ajax_hidden_emmiter').show();
  });

  if (RMPlus.Utils.exists('Usability.settings.show_sidebar_close_button') && RMPlus.Usability.settings.show_sidebar_close_button) {
      var close_sidebar = $('<a/>', { href: '#',
                                      id: 'close_sidebar_icon',
                                      class: 'R close_sidebar icon',
                                      click: function () {
                                        var btn = $(this);
                                        if (btn.hasClass('close_sidebar')) {
                                          RMPlus.Usability.hide_sidebar(btn);
                                        } else {
                                          RMPlus.Usability.show_sidebar(btn);
                                        }
                                      }
                          });
      $('#sidebar').prepend(close_sidebar);

      var closed = ('localStorage' in window && window['localStorage'] !== null) ? localStorage["sidebar_closed"] : false;
      if (closed === "true") {
        RMPlus.Usability.hide_sidebar($('#close_sidebar_icon'));
      }
  }

  if (RMPlus.Utils.exists('Usability.settings.collapse_changes_for_history') && RMPlus.Usability.settings.collapse_changes_for_history) {
    $('#history .journal:has(.details)').wrap('<div class="us-collapsible collapsed">');
    $('#history .journal:has(.details) h4').after("<div class='us-collapse-wrapper'><a class='in_link icon us-collapser'><span class='collapsed'>" + RMPlus.Usability.expand_label + "</span><span class='expanded'>" + RMPlus.Usability.collapse_label + "</span></a></div>");

    $(document.body).on('click', '.us-collapser', function() {
      $(this).closest('.us-collapsible').toggleClass('collapsed');
    });
  }

  $('.splitcontentleft ul').each(function () {
    if ($(this).children().length == 0)
      $(this).remove();
  });

  if (RMPlus.Utils.exists('Usability.settings.enable_underlined_links') && RMPlus.Usability.settings.enable_underlined_links) {
    RMPlus.Usability.underlineMenusAndIcons();
    RMPlus.Usability.underlineTabs();
  }

  $(document.body).on('change', '#us-subordinates-select2', function () {
    RMPlus.Usability.us_easy_perplex_actions_submit();
  });

  $('#us-easy-perplex-link').click(function () {
    $('#easy-perplex-modal-window').html('<div class="us-big-loader"></div>');
    $('#easy-perplex-modal-window').modal('hide');
    $('#easy-perplex-modal-window').data('modal', null);
    $('#easy-perplex-modal-window').modal({ keyboard: true });
    $.ajax({ type: 'GET',
             url: this.href });
    return false;
  });

});
