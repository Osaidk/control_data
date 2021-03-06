define(
   ({
    map: {
      error: "Det går inte att skapa kartan"
    },
    onlineStatus: {
      offline: "Du arbetar just nu offline. Inskickade formulär sparas lokalt tills det går att ansluta till servern.",
      reconnecting: "Återansluter&hellip;",
      pending: "${total} väntande redigering(ar) skickas in när nätverksanslutningen har återupprättats."
    },
    configure: {
      mapdlg: {
        items: {
          organizationLabel: "Min organisation",
          onlineLabel: "ArcGIS Online",
          contentLabel: "Mitt innehåll",
          favoritesLabel: "Mina favoriter"
        },
        title: "Välj webbkarta",
        searchTitle: "Sök",
        ok: "OK",
        cancel: "Avbryt",
        placeholder: "Ange sökterm"
      },
      groupdlg: {
        items: {
          organizationLabel: "Min organisation",
          onlineLabel: "ArcGIS Online",
          contentLabel: "Mitt innehåll",
          favoritesLabel: "Mina favoriter"
        },
        title: "Välj grupp",
        searchTitle: "Sök",
        ok: "OK",
        cancel: "Avbryt",
        placeholder: "Ange sökterm"
      },
      sharedlg: {
        items: {},
        mailtoLinkDescription: "Här är en länk till en GeoForm"
      }
    },
    user: {
      mgrs: "MGRS",
      usng: "USNG",
      utm: "UTM",
      utm_northing: "Nordlig",
      utm_easting: "Östlig",
      utm_zone_number: "Zonnummer",
      selectLayerTabText: "${formSection} Välj formulär",
      geoFormGeneralTabText: "${formSection} Ange information",
      locationInformationText: "${formSection} Välj plats",
      submitInformationText: "${formSection} Fyll i formulär",
      submitInstructions: "Lägg till den här informationen i kartan.",
      myLocationText: "Aktuell plats",
      locationDescriptionForMoreThanOneOption: "Ange en plats för det här bidraget genom att klicka/peka på kartan eller använda något av följande alternativ.",
      locationDescriptionForOneOption: "Ange en plats för den här posten genom att klicka/peka på kartan eller använda följande alternativ.",
      locationDescriptionForNoOption: "Ange plats för den här posten genom att klicka/peka på kartan.",
      addressText: "Sök",
      geographic: "Lat/lon",
      locationTabText: "Plats",
      locationPopupTitle: "Plats",
      submitButtonText: "Skicka in bidrag",
      submitButtonTextLoading: "Skickar in&hellip;",
      formValidationMessageAlertText: "Följande fält krävs:",
      selectLocation: "Välj en plats för ditt bidrag.",
      emptylatitudeAlertMessage: "Ange en ${openLink}latitud${closeLink}-koordinat.",
      emptylongitudeAlertMessage: "Ange en ${openLink}longitud${closeLink}-koordinat.",
      shareUserTitleMessage: "Tack för ditt bidrag!",
      entrySubmitted: "Ditt bidrag har lämnats in till kartan.",
      shareThisForm: "Dela det här formuläret",
      shareUserTextMessage: "Uppmana andra att bidra med följande alternativ.",
      addAttachmentFailedMessage: "Det gick inte att lägga till bilagan i lagret",
      addFeatureFailedMessage: "Det gick inte att lägga till geoobjektet i lagret",
      noLayerConfiguredMessage: "Ett fel uppstod när ett redigerbart geoobjektslager skulle läsas in eller sökas. För att visa formuläret och börja samla in bidrag måste du lägga till ett redigerbart geoobjektslager i webbkartan.",
      placeholderLatitude: "Latitud (Y)",
      placeholderLongitude: "Longitud (X)",
      latitude: "Latitud",
      longitude: "Longitud",
      findMyLocation: "Hitta mig",
      finding: "Lokaliserar&hellip;",
      backToTop: "Tillbaka till start",
      addressSearchText: "Ditt bidrag kommer att visas här. Du kan dra nålen för att korrigera platsen.",
      shareModalFormText: "Formulärlänk",
      close: "Stäng",
      locationNotFound: "Det gick inte att hitta platsen.",
      setLocation: "Ange plats",
      find: "Sök efter adress eller plats",
      attachment: "Bilaga",
      toggleDropdown: "Växla listmenyn",
      invalidString: "Ange ett giltigt värde.",
      invalidSmallNumber: "Ange ett giltigt ${openStrong}heltalsvärde${closeStrong} mellan -32768 och 32767.",
      invalidNumber: "Ange ett giltigt ${openStrong}heltalsvärde${closeStrong} mellan -32768 och 32767.",
      invalidFloat: "Ange ett giltigt ${openStrong}flyttalsvärde${closeStrong}.",
      invalidDouble: "Ange ett giltigt värde med ${openStrong}dubbel precision${closeStrong}.",
      invalidLatLong: "Ange giltiga koordinater för latitud och longitud.",
      invalidUTM: "Ange giltiga UTM-koordinater.",
      invalidUSNG: "Ange giltiga USNG-koordinater.",
      invalidMGRS: "Ange giltiga MGRS-koordinater.",
      geoformTitleText: "GeoForm",
      domainDefaultText: "Välj&hellip;",
      applyEditsFailedMessage: "Ditt bidrag kan tyvärr inte lämnas in. Försök igen.",
      requiredFields: "Det förekommer några fel. Rätta till dem nedan.",
      requiredField: "(obligatoriskt)",
      error: "Fel",
      textRangeHintMessage: "${openStrong}Tips:${closeStrong} minsta värde ${minValue} och största värde ${maxValue}",
      dateRangeHintMessage: "${openStrong}Tips:${closeStrong} minsta datum ${minValue} och största datum ${maxValue}",
      remainingCharactersHintMessage: "${value} tecken återstår",
      mapFullScreen: "Helskärm",
      mapRestore: "Återställ",
      filterSelectEmptyText: "Välj",
      invalidLayerMessage: "Formulärlagret finns inte. Konfigurera programmet och ställ in lagret.",
      selectedLayerText: "Alla",
      fileUploadStatus: "Status för uppladdning av fil",
      uploadingBadge: "&nbsp;Laddas upp&hellip;",
      successBadge: "&nbsp;Uppladdad",
      retryBadge: "Försök igen",
      errorBadge: "Fel vid uppladdning&nbsp;&nbsp;&nbsp;",
      fileTooLargeError: "Filen är för stor för att bifoga",
      exceededFileCountError: "Överskrider högsta antalet tillåtna bilagor",
      selectFileTitle: "Välj en fil",
      btnViewSubmissions: "Visa bidrag",
      dateFormat: "yyyy-MM-dd H:mm"
    },
    builder: {
      invalidUser: "Du har tyvärr inte behörighet att visa det här objektet",
      invalidWebmapSelectionAlert: "Den valda webbkartan innehåller inte någon giltigt lager som kan användas. Lägg till ett redigerbart geoobjektlager i webbkartan för att fortsätta.",
      invalidWebmapSelectionAlert2: "Mer information finns i ${openLink}Vad är geoobjekttjänster?${closeLink}",
      selectFieldsText: "Välj formulärfält",
      selectThemeText: "Välj formulärtema",
      webmapText: "Webbkarta",
      layerText: "Lager",
      detailsText: "Information",
      fieldsText: "Fält",
      styleText: "Format",
      optionText: "Alternativ",
      previewText: "Förhandsgranska",
      publishText: "Publicera",
      optionsApplicationText: "Alternativ",
      titleText: "Byggverktyg",
      descriptionText: "GeoForm är en konfigurerbar mall för formulärbaserad dataredigering av en ${link1}geoobjektstjänst${closeLink}. Med den här applikationen kan användare ange data via ett formulär i stället för en kartas popupfönster, samtidigt som de utnyttjar funktionerna i ${link2}webbkartan${closeLink} och de redigerbara geoobjektstjänsterna. Använd följande steg för att anpassa och distribuera GeoForm.",
      btnPreviousText: "Föregående",
      btnNextText: "Nästa",
      webmapTabTitleText: "Välj en webbkarta",
      viewWebmap: "Visa webbkarta",
      webmapDetailsText: "Den valda webbkartan är ${webMapTitleLink}${webMapTitle}${closeLink}. Om du vill välja en annan webbkarta klickar du på Välj webbkarta",
      btnSelectWebmapText: "Välj webbkarta",
      btnSelectWebmapTextLoading: "Laddar&hellip;",
      layerTabTitleText: "Välj redigerbart lager",
      selectLayerLabelText: "Lager",
      selectLayerDefaultOptionText: "Välj lager",
      defaultBasemap: "Växla baskarta",
      secondaryBasemap: "Standardbaskarta",
      detailsTabTitleText: "Formulärinformation",
      detailTitleLabelText: "Titel",
      detailLogoLabelText: "Logobild",
      descriptionLabelText: "Formuläranvisningar och -information",
      fieldDescriptionLabelText: "Hjälptext (valfritt)",
      fieldTabFieldHeaderText: "Fält",
      fieldTabLabelHeaderText: "Etikett",
      fieldTabDisplayTypeHeaderText: "Visa som",
      fieldTabOrderColumnText: "Ordna",
      fieldTabVisibleColumnText: "Aktiverad",
      displayFieldText: "Visa fält",
      selectMenuOption: "Valmeny",
      selectRadioOption: "Alternativknapp",
      selectTextOption: "Text",
      selectDateOption: "Datumväljare",
      selectRangeOption: "Snurrikon",
      selectCheckboxOption: "Kryssruta",
      selectMailOption: "E-post",
      selectUrlOption: "URL",
      selectTextAreaOption: "Textområde",
      previewApplicationText: "Förhandsgranska applikation",
      saveApplicationText: "Spara applikation",
      saveText: "Spara",
      toggleNavigationText: "Växla navigering",
      formPlaceholderText: "Mitt formulär",
      shareBuilderInProgressTitleMessage: "Publicerar GeoForm",
      shareBuilderProgressBarMessage: "Vänta&hellip;",
      shareBuilderTitleMessage: "Objektet har sparats",
      shareBuilderTextMessage: "Du kan börja samla in information genom att dela med andra",
      shareModalFormText: "Formulärlänk",
      shareBuilderSuccess: "Ditt GeoForm har uppdaterats och publicerats!",
      geoformTitleText: "GeoForm",
      layerTabText: "Det är detta lager du bygger ditt GeoForm från. Lagret måste vara en geoobjekttjänst som är aktiverad för redigering med delningsbehörigheter lämpliga för din publik.",
      detailsTabText: "Använd rutorna för formulärinformation nedan för att anpassa titeln, lägga till en anpassad logo och ange en kort beskrivning för GeoForm-publiken. I beskrivningen kan du lägga till länkar till andra resurser, kontaktinformation och till och med visa publiken till ett webbkartprogram som innehåller alla data som har samlats in med GeoForm",
      fieldsTabText: "Här kan du välja vilka fält som ska visas för din GeoForm-publik, redigera vilka etiketter som ska visas och ange en kort beskrivning som underlättar datainmatningen.",
      styleTabText: "Formatera ditt GeoForm med de teman som finns nedan enligt dina önskemål.",
      publishTabText: "Om du är färdig med anpassningen av ditt GeoForm kan du spara programmet och börja dela det med din publik. Då kan alltid återgå till byggverktyget och fortsätta att anpassa det utifrån den återkoppling du får.",
      headerSizeLabel: "Rubrikstorlek",
      smallHeader: "Använd liten rubrik",
      bigHeader: "Använd stor rubrik",
      pushpinText: "Knappnål",
      doneButtonText: "Spara och avsluta",
      fieldTabPlaceHolderHeaderText: "Tips (valfritt)",
      enableAttachmentLabelText: "${openStrong}Aktivera bilagor${closeStrong}",
      enableAttachmentLabelHint: "Du kan aktivera/inaktivera bilagorna här",
      attachmentIsRequiredLabelText: "${openStrong}Bilaga krävs${closeStrong}",
      attachmentIsRequiredLabelHint: "Om det är nödvändigt kan användarna behöva ange en bilaga.",
      attachmentLabelText: "Etikett för knappen Bilaga",
      attachmentLabelHint: "Den här texten visas bredvid knappen Bilaga. I det här utrymmet kan du beskriva vad du vill att publiken ska bifoga (foto, video, dokument o.s.v.), vilket filformat du ber om (.jpeg, .png, .docx, .pdf o.s.v.) och eventuella övriga anvisningar",
      attachmentDescription: "Beskrivning av bilaga",
      attachmentHint: "Vid behov kan du ange ytterligare information om bilagor här.",
      jumbotronDescription: "Använd en stor eller liten rubrik för formuläret. En stor rubrik kan hjälpa till att definiera syftet med din applikation men den tar upp mer plats på skärmen.",
      shareGeoformText: "Dela GeoForm",
      shareDescription: "Med delningspanelen är det enkelt för din publik att dela GeoForm med andra som har lämnat ett bidrag. Du kan inaktivera den när som helst.",
      defaultMapExtent: "Standardutbredning för karta",
      defaultMapExtentDescription: "Kartan återgår till standardutbredningen i webbkartan efter bidraget. Detta går att inaktivera när som helst.",
      pushpinOptionsDescription: "Välj mellan flera olika färger på kartans knappnål. Den bör skilja sig från kartans symbologi för att hjälpa användaren placera sitt bidrag på kartan",
      selectLocationText: "Välj plats enligt",
      myLocationText: "Min plats",
      searchText: "Sök",
      coordinatesText: "Latitud- och longitudkoordinater",
      usng: "USNG-koordinater",
      mgrs: "MGRS-koordinater",
      utm: "UTM-koordinater",
      selectLocationSDescription: "Låt användare välja en plats med de här metoderna.",
      dragTooltipText: "Dra fältet dit du vill ha det",
      showHideLayerText: "Visa lager",
      showHideLayerHelpText: "Du kan konfigurera din GeoForm med Visa/Dölj lager. Det här alternativet fungerar bara på en konfiguration med ett ensamt lager.",
      labelHelpMessage: "Etikett",
      placeHolderHintMessage: "Tipstext",
      placeHolderHelpMessage: "Hjälptext",
      selectTextOptionValue: "Välj filter",
      disableLogo: "Inaktivera logotyp",
      disableLogoDescription: "Du kan konfigurera din GeoForm så att logotypen visas/döljs i formulärrubriken",
      locateOnLoadText: "Lokalisera vid inläsning",
      locateOnLoadDescription: "Du kan konfigurera din GeoForm så att den använder den aktuella positionen vid inläsningen av sidan",
      selectLayerFieldTabText: "Välj lager",
      allLayerSelectOptionText: "Alla",
      disableViewer: "Inaktivera vy",
      disableViewerDescription: "Du kan konfigurera din GeoForm så att vyn aktiveras/inaktiveras",
      displayFieldHintText: "Det valda visningsfältet kommer att visas i viewerMode som titelfält"
    },
    viewer: {
      geocoderCancelText: "Avbryt",
      viewReportsTabText: "Bidrag",
      viewLegendTabText: "Teckenförklaring",
      viewAboutusTabText: "Om",
      viewMapTabText: "Karta",
      sortHeaderText: "Sortera efter:",
      btnSubmitReportText: "Skicka in en rapport",
      geocoderPlaceholderText: "Postnummer, ort osv.",
      noSearchResult: "Inga resultat hittades",
      recordsTabTooltip: "Visa bidrag",
      legendTabTooltip: "Teckenförklaring",
      aboutUsTabTooltip: "Om oss",
      mapTabTooltip: "Karta",
      appLoadingFailedMessage: "ViewerMode är inte tillgängligt",
      btnDescendingText: "Fallande",
      btnAscendingText: "Stigande",
      geometryUnavailableErrorMessage: "Det går inte att hitta geoobjektets geometri",
      infoPopupOffErrorMessage: "InfoPopup är avstängd",
      btnLoadMoreText: "Läs in mer",
      unavailableTitleText: "Namnlös",
      unavailableConfigMessage: "Det går inte att läsa in konfigurationen"
    }
  })
);